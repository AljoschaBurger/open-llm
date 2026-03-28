// Package handler provides HTTP handlers for processing requests.
package handlers

import (
	"bufio"
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

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

	// Parse the JSON-encoded prompt from the request body into the ollama.PromptRequest struct.
	var req ollama.PromptRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
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
				Content: instruction,
			})
		}
	}

	messages = append(messages, ollama.ChatMessage{
		Role:    "user",
		Content: req.Prompt,
	})

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

	// transforms the request-struct into json bytes to be handled by io.Reader
	body, _ := json.Marshal(ollamaReq)

	ctx := r.Context()

	// builds a http-request out of the json serialized struct
	ollamaHTTPReq, err := http.NewRequestWithContext(
		ctx,
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

	for scanner.Scan() {
		line := scanner.Text()       // every line is a chunk send by ollama
		w.Write([]byte(line + "\n")) // immediately sends the current line to the frontend
		flusher.Flush()              // enables the immediate sending through streaming
	}
}
