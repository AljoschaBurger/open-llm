package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	db_presets "github.com/AljoschaBurger/open-llm/db"
)

type instruction struct {
	Name        string
	Instruction string
}

func HandleCreateInstruction(
	db *sql.DB,
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req instruction
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Instruction == "" {
		http.Error(w, "Name and instruction cannot be empty", http.StatusBadRequest)
		return
	}

	// debugging
	if err := db.Ping(); err != nil {
		log.Fatal("Database connection error:", err)
	}

	log.Println("Executing query:", db_presets.CreateInstruction)
	_, err := db.Exec(db_presets.CreateInstruction)
	if err != nil {
		http.Error(w, "Can not create table instruction", http.StatusBadRequest)
		return
	}

	var exists bool
	log.Println(req.Name)
	err = db.QueryRow("select exists(select 1 from instruction where name = ?)", req.Name).Scan(&exists)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if exists {
		http.Error(w, "Entry already exists", http.StatusConflict)
		return
	}

	_, err = db.Exec("insert into instruction (name, instruction) values (?, ?)", req.Name, req.Instruction)

	if err != nil {
		http.Error(w, "Unable to insert the given instruction into the database", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message: "Instruction created successfully}`))
}
