package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/AljoschaBurger/open-llm/handlers"
	"github.com/go-sql-driver/mysql"
	"github.com/rs/cors"
)

var db *sql.DB

func main() {

	mux := http.NewServeMux()

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:8080"}, // react-vite frontend + curl
		AllowedMethods:   []string{"POST", "GET", "DELETE", "PUT", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	// configurate db connection
	cfg := mysql.NewConfig()
	cfg.User = "root"
	cfg.Passwd = "root123"
	cfg.Net = "tcp"
	cfg.Addr = "mysql:3306"
	cfg.DBName = "llm-db"

	var err error
	db, err = sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		log.Fatal("Error while trying to connect to the database", err)
		return
	}
	log.Println("Successfully connected to database")

	// test connection with "ping"
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode("Pong")
	})

	// default prompting handle
	handlePrompt := handlers.HandlePrompt
	mux.HandleFunc("/ask", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received request with method: %s", r.Method)
		handlePrompt(db, w, r)
	})

	// creates instruction file with user input
	handleCreateInstruction := handlers.HandleCreateInstruction
	mux.HandleFunc("/create-instruction", func(w http.ResponseWriter, r *http.Request) {
		handleCreateInstruction(db, w, r)
	})

	log.Println("Backend running on Port :8080")
	log.Fatal(http.ListenAndServe("0.0.0.0:8080", handler))
}
