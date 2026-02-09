// Package handler provides HTTP handlers for processing requests.
package handlers

import (
	"bufio"
	"bytes"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/AljoschaBurger/open-llm/ollama"
)

var OllamaHTTPClient = &http.Client{}

// Ollama and docker information
var usedModel = "llama3.1:8b-instruct-q4_1"                                      // the specific llm model
var usedContainer = "llm"                                                        // the container name from the llm defined in the docker-compose.yaml file
var usedPort = "11434"                                                           // the port where the llm is running
var OllamaBaseURL = "http://" + usedContainer + ":" + usedPort + "/api/generate" // full URL with endpoint

// HandlePrompt processes HTTP POST requests to interact with the Ollama LLM.
// It reads a prompt from the request body, validates the JSON, and prepares the prompt for further processing.
// The response is streamed back to the client in a chunked format.
func HandlePrompt(
	db *sql.DB,
	w http.ResponseWriter,
	r *http.Request) {
	log.Println("ARGH")
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

	// if there is an instruction file - put it in the beginning of the prompt
	if req.Instruction != "" {
		var instruction string
		err := db.QueryRow("select instruction from instruction where name = ?", req.Instruction).Scan(&instruction)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Instruction file not found", http.StatusNotFound)
				return
			} else {
				http.Error(w, "Failed to get instruction from database", http.StatusInternalServerError)
				return
			}
		}

		req.Prompt = instruction + req.Prompt
	}

	// build the request-struct out of the validated prompt
	ollamaRequest := ollama.OllamaRequest{
		Model:  usedModel,  // default should be llama3.1:8b-instruct-q4_1
		Prompt: req.Prompt, //the validated prompt
		Stream: true,       //needs to be true
	}

	// transforms the request-struct into json bytes to be handled by io.Reader
	body, err := json.Marshal(ollamaRequest)
	if err != nil {
		http.Error(w, "Failed to marshal request", 500)
		return
	}

	// builds a http-request out of the json serialized struct
	ollamaHTTPReq, err := http.NewRequest(
		"POST",
		OllamaBaseURL,
		bytes.NewBuffer(body),
	)

	if err != nil {
		http.Error(w, "Failed to create new POST-Request", 500)
		return
	}

	ollamaHTTPReq.Header.Set("Content-Type", "application/json")

	// calls the request through the given client and get a response
	client := OllamaHTTPClient
	resp, err := client.Do(ollamaHTTPReq)
	if err != nil {
		http.Error(w, "Failed to contact Ollama", 500)
		return
	}

	defer resp.Body.Close() // reponse-socket needs to be closed to release the information

	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Transfer-Encoding", "chunked") // chunked is importend to send the splitted information to the frontend (streamed)

	flusher, ok := w.(http.Flusher) // check if the responseWriter is able to flush
	if !ok {
		http.Error(w, "Streaming not supported", 500)
		return
	}

	scanner := bufio.NewScanner(resp.Body) //scans the response from the llm
	for scanner.Scan() {
		line := scanner.Text()       // every line is a chunk send by ollama
		w.Write([]byte(line + "\n")) // immediately sends the current line to the frontend
		flusher.Flush()              // enables the immediate sending through streaming
	}
}
