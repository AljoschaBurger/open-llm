package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type updateRequest struct {
	OldName        string `json:"oldName"`
	NewName        string `json:"newName"`
	NewInstruction string `json:"newInstruction"`
}

func HandleUpdateInstruction(
	w http.ResponseWriter,
	r *http.Request,
	db *sql.DB,
) {
	if r.Method != http.MethodPatch {
		http.Error(w, "Error: Only PATCH allowed", http.StatusMethodNotAllowed)
		return
	}

	var req updateRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Error while trying to decode request into json", http.StatusBadRequest)
		return
	}

	if req.NewName == "" || req.OldName == "" || req.NewInstruction == "" {
		http.Error(w, "Fields are not allowed to be empty", http.StatusBadRequest)
		return
	}

	res, err := db.Exec("update instruction set name = ?, instruction = ? where name = ?", req.NewName, req.NewInstruction, req.OldName)
	if err != nil {
		http.Error(w, "Error while trying to update database", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "No instruction found with that name", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]string{
		"message": "Succesfully updated the database",
	}

	json.NewEncoder(w).Encode(response)
}
