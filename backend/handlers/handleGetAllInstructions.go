package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

type instruction struct {
	Name        string `json:"name"`
	Instruction string `json:"instruction"`
}

func HandleGetAllInstructionFiles(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	instructions := []instruction{}

	rows, err := db.Query("select name, instruction from instruction")
	if err != nil {
		log.Printf("DB Query Error: %v", err)
		http.Error(w, "Database Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var i instruction
		if err := rows.Scan(&i.Name, &i.Instruction); err != nil {
			log.Printf("Scan Error: %v", err)
			continue
		}
		instructions = append(instructions, i)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error during iteration", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(instructions)
}
