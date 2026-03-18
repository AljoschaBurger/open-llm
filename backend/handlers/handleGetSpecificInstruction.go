package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

func HandleGetSpecificInstruction(
	w http.ResponseWriter,
	r *http.Request,
	db *sql.DB,
) {
	if r.Method != http.MethodGet {
		http.Error(w, "Error: Wrong method used", http.StatusInternalServerError)
		return
	}

	name := r.URL.Query().Get("name")

	if name == "" {
		http.Error(w, "Error: Empty name param but name is required", http.StatusBadRequest)
		return
	}

	var instructionContent string
	err := db.QueryRow("select instruction from instruction where name = ?", name).Scan(&instructionContent)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Nicht gefunden"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]string{
		"instruction": instructionContent,
	}

	json.NewEncoder(w).Encode(response)
}
