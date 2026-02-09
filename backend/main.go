package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/AljoschaBurger/open-llm/handler"
)

func main() {
	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode("Pong")
	})

	handlePrompt := handler.HandlePrompt
	http.HandleFunc("/ask", func(w http.ResponseWriter, r *http.Request) {
		handlePrompt(w, r)
	})

	log.Println("Backend running on Port :8080")
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", nil))
}
