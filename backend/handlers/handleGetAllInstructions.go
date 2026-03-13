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

func HandleGetAllInstructionFiles(
	db *sql.DB,
	w http.ResponseWriter,
	r *http.Request,
) {
	w.Header().Set("Content-Type", "application/json")

	var counter int

	err := db.QueryRow("select count(*) from instruction").Scan(&counter)
	if err != nil {
		http.Error(w, "Database Error:", http.StatusBadRequest)
		return
	}

	if counter == 0 {
		// no instructions stored in db
		return
	}

	rows, err := db.Query("select * from instruction")

	if err != nil {
		log.Fatalf("Error while trying to get the instrctions from the database: %v", err)
	}

	defer rows.Close()

	var instructions []instruction

	for rows.Next() {
		var i instruction
		if err := rows.Scan(&i.Name, &i.Instruction); err != nil {
			log.Printf("Error while trying to scan the lines of the instruction: %v", err)
		}
		instructions = append(instructions, i)
	}

	if err = rows.Err(); err != nil {
		log.Fatalf("Error after iterating over lines: %v", err)
	}

	jsonData, err := json.MarshalIndent(instructions, "", " ")
	if err != nil {
		log.Fatalf("Error while json serialization: %v", err)
	}

	w.WriteHeader(http.StatusOK)
	_, err = w.Write(jsonData)
	if err != nil {
		log.Printf("Error while writing json response: %v", err)
	}

}
