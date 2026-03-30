package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

type GetAllInstructionsStore interface {
	GetRows() (*sql.Rows, error)
}

type instruction struct {
	Name        string `json:"name"`
	Instruction string `json:"instruction"`
}

type GetAllInstructionsSQL struct {
	DB *sql.DB
}

func (g *GetAllInstructionsSQL) GetRows() (*sql.Rows, error) {
	rows, err := g.DB.Query("SELECT name, instruction FROM instruction")
	if err != nil {
		return nil, err
	} else {
		return rows, err
	}
}

func HandleGetAllInstructionFiles(g GetAllInstructionsStore, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	instructions := []instruction{}

	rows, err := g.GetRows()
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
