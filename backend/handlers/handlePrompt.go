// Package handler provides HTTP handlers for processing requests.
package handlers

import (
	"bufio"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/AljoschaBurger/open-llm/mcp"
	"github.com/AljoschaBurger/open-llm/ollama"
)

var OllamaHTTPClient = &http.Client{}

// Ollama and docker information
var usedModel = "llama3.1:8b-instruct-q4_1"                                  // the specific llm model
var usedContainer = "llm"                                                    // the container name from the llm defined in the docker-compose.yaml file
var usedPort = "11434"                                                       // the port where the llm is running
var ollamaBaseURL = "http://" + usedContainer + ":" + usedPort + "/api/chat" // full URL with endpoint

func checkForTable(db *sql.DB, dbName string, tableName string) (bool, error) {
	query := `select count(*) from information_schema.TABLES where TABLE_SCHEMA = ? AND TABLE_NAME = ?`
	var count int
	err := db.QueryRow(query, dbName, tableName).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("Error while trying to check if %s table exists: %w", tableName, err)
	}
	return count > 0, nil
}

// HandlePrompt processes HTTP POST requests to interact with the Ollama LLM.
// It reads a prompt from the request body, validates the JSON, and prepares the prompt for further processing.
// The response is streamed back to the client in a chunked format.
func HandlePrompt(
	db *sql.DB,
	w http.ResponseWriter,
	r *http.Request) {
	// Ensure the request method is POST; reject other methods with a 405 status.
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var systemPrompt string

	// Parse the JSON-encoded prompt from the request body into the ollama.PromptRequest struct.
	var req ollama.PromptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.ToolUsage {
		systemPrompt = ollama.BasicInstruction
	} else {
		systemPrompt = "You currently have NO access to external tools, the internet, or live data. Answer everything based on your own knowledge."
	}

	var messages []ollama.ChatMessage

	// if there is an instruction inside of the request - put it in the beginning of the prompt
	if req.Instruction != "" {
		doesInstructionExist, err := checkForTable(db, "llm-db", "instruction")
		if !doesInstructionExist {
			db.Exec("CREATE TABLE IF NOT EXISTS instruction (name varchar(255) NOT NULL PRIMARY KEY, instruction TEXT NOT NULL)")
		}
		var instruction string
		err = db.QueryRow("SELECT instruction FROM instruction WHERE name = ?", req.Instruction).Scan(&instruction)

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Instruction file not found", http.StatusNotFound)
				return
			} else {
				http.Error(w, "Failed to get instruction from database", http.StatusInternalServerError)
				return
			}
		} else {
			messages = append(messages, ollama.ChatMessage{
				Role:    "system",
				Content: instruction + "\n\n" + systemPrompt,
			})
		}
	} else {
		messages = append(messages, ollama.ChatMessage{
			Role: "system",
			// WICHTIG: Hier die Basis-Anleitung mit Zeilenumbruch anhängen!
			Content: systemPrompt,
		})
	}

	messages = append(messages, ollama.ChatMessage{
		Role:    "user",
		Content: req.Prompt,
	})

	// defining the tools for the llm to chose from
	myTools := ollama.Tool{
		Type: "function",
		Function: struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Parameters  any    `json:"parameters"`
		}{
			Name:        "get_current_time",
			Description: "Only use this tool if the user asks for the current time.A tool to get the current time in a given city.",
			Parameters: map[string]interface{}{
				// should return one JSON object
				"type": "object",
				"properties": map[string]interface{}{
					"city": map[string]string{
						"type":        "string",
						"description": "The name of the city",
					},
				},
				"required": []string{"city"},
			},
		},
	}

	ollamaReq := ollama.OllamaChatRequest{
		Model:    usedModel,
		Messages: messages,
		Stream:   true,
		Options: ollama.Options{
			Temperature: ollama.FallbackFloat(req.Temperature, 0.2),
			TopP:        ollama.FallbackFloat(req.TopP, 0.4),
			NumPredict:  ollama.FallbackInt(req.NumPredict, 1000),
		},
	}

	if req.ToolUsage {
		// only if the request includes tool_usage = true
		ollamaReq.Tools = []ollama.Tool{myTools}
	}

	// transforms the request-struct into json bytes to be handled by io.Reader
	body, _ := json.Marshal(ollamaReq)

	ctx := r.Context()

	// builds a http-request out of the json serialized struct
	ollamaHTTPReq, err := http.NewRequestWithContext(
		r.Context(),
		"POST",                // Method
		ollamaBaseURL,         // container url from the llm
		bytes.NewBuffer(body), // the actual json body with the information from the user request as bytes
	)

	if err != nil {
		http.Error(w, "Failed to create new POST-Request", 500)
		return
	}

	ollamaHTTPReq.Header.Set("Content-Type", "application/json")

	// calls the request through the given client and get a response
	resp, err := OllamaHTTPClient.Do(ollamaHTTPReq)
	if err != nil {
		if ctx.Err() != nil {
			return
		}
		http.Error(w, "Ollama is currently offline", 500)
		return
	}

	defer resp.Body.Close() // reponse-socket needs to be closed to release the information

	// TODO: Tool check + Tool call
	// chek if there is a tool set

	w.Header().Set("Content-Type", "application/x-ndjson")
	//w.Header().Set("Transfer-Encoding", "chunked") // chunked is importend to send the splitted information to the frontend (streamed)

	flusher, ok := w.(http.Flusher) // check if the responseWriter is able to flush
	if !ok {
		http.Error(w, "Streaming not supported", 500)
		return
	}

	scanner := bufio.NewScanner(resp.Body) //scans the response from the llm
	const maxCapacity = 512 * 1024         //512 KB
	buf := make([]byte, maxCapacity)
	scanner.Buffer(buf, maxCapacity)

	isToolCall := false
	var collectedToolCalls []ollama.ToolCall // stores the executed tools
	var assistantText string                 // stores the text which may be generated before the tool call

	for scanner.Scan() {
		line := scanner.Text() // every line is a chunk send by ollama
		var chunk ollama.ChatResponseChunk
		err := json.Unmarshal([]byte(line), &chunk) // parsing each line of output into a chunk object
		if err != nil {
			continue
		}

		if len(chunk.Message.ToolCalls) > 0 {

			fmt.Printf("LOG: Tool Call 1" + chunk.Message.ToolCalls[0].Function.Name)
			fmt.Printf("LOG: Tool Call Länge %d", len(chunk.Message.ToolCalls))

			isToolCall = true
			// storing the tool call instead of sending it via stream to the frontend
			collectedToolCalls = chunk.Message.ToolCalls
			continue
		}
		if !isToolCall {
			w.Write([]byte(line + "\n"))
			flusher.Flush()
			assistantText += chunk.Message.Content
		}
	}

	if isToolCall {
		sendIntermediateMessage(w, flusher, "🛠️ Using MCP-Tooling...")

		messages = append(messages, ollama.ChatMessage{
			Role:      "assistant",
			Content:   assistantText,
			ToolCalls: collectedToolCalls,
		})

		// TODO: maybe build this into a seperated function/ file to be more modular
		for _, toolCall := range collectedToolCalls {
			var toolResult string
			fmt.Printf("LOG: LLM versucht Tool aufzurufen: '%s'\n", toolCall.Function.Name)
			fmt.Printf("LOG: Mit diesen Argumenten: %+v\n", toolCall.Function.Args)

			if toolCall.Function.Name == "get_current_time" {
				args := toolCall.Function.Args
				cityInterface, exists := args["city"]

				if !exists {
					toolResult = "Error: The parameter 'city' is invalid"
				} else {
					cityStr, ok := cityInterface.(string)
					if !ok {
						toolResult = "Error: The parameter 'city' is invalid."
					} else {
						timeString := mcp.GetCurrentTime(cityStr)
						toolResult = fmt.Sprintf(`{"success": true, "result": "%s"}`, timeString)
					}
				}
			} else {
				toolResult = "Error: Tool not found"
			}

			fmt.Printf("LOG: Backend schickt dieses Ergebnis ans LLM: %s\n", toolResult)

			messages = append(messages, ollama.ChatMessage{
				Role:    "tool",
				Content: toolResult,
			})
		}

		// final call without tooling
		ollamaReq.Messages = messages
		ollamaReq.Tools = nil

		body, _ = json.Marshal(ollamaReq)
		httpReq2, _ := http.NewRequestWithContext(
			ctx,
			"POST",
			ollamaBaseURL,
			bytes.NewBuffer(body),
		)

		httpReq2.Header.Set("Content-Type", "application/json")
		resp2, err := OllamaHTTPClient.Do(httpReq2)
		if err != nil {
			return
		}

		defer resp2.Body.Close()

		scanner2 := bufio.NewScanner(resp2.Body)
		scanner2.Buffer(make([]byte, 512*1024), 512*1024)

		for scanner2.Scan() {
			line := scanner2.Text()
			w.Write([]byte(line + "\n"))
			flusher.Flush()
		}
	}
}

func sendIntermediateMessage(w http.ResponseWriter, flusher http.Flusher, msg string) {
	// Message for the frontend to inform the user about the tool usage
	fakeChunk := fmt.Sprintf(`{"model":"%s","message":{"role":"assistant","content":"\n_%s_\n\n"},"done":false}`, usedModel, msg)
	w.Write([]byte(fakeChunk + "\n"))
	flusher.Flush()
}
