package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type DeleteInstructionStore interface {
	CountEntries(name string) (int, error)
	Delete(name string) error
}

type SQLDeleteInstructionStore struct {
	DB *sql.DB
}

// counts the entries with the given name in the instruction table - returns count value and error
func (s *SQLDeleteInstructionStore) CountEntries(name string) (int, error) {
	var counter int
	err := s.DB.QueryRow("SELECT COUNT(*) FROM instruction WHERE name = ?", name).Scan(&counter)

	return counter, err
}

// Deletes the table entry with the given name - returns error
func (s *SQLDeleteInstructionStore) Delete(name string) error {
	_, err := s.DB.Exec("DELETE FROM instruction WHERE name = ?", name)

	return err
}

func HandleDeleteInstruction(
	db DeleteInstructionStore,
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Only DELETE is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req Instruction
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}

	counter, err := db.CountEntries(req.Name)
	if err != nil {
		http.Error(w, "Error while trying to delete instruction", http.StatusInternalServerError)
		return
	}

	if counter == 0 {
		http.Error(w, "Given instruction does not exist", http.StatusBadRequest)
		return
	}

	err = db.Delete(req.Name)
	if err != nil {
		http.Error(w, "Error while trying to delete instruction", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Instruction deleted successfully"}`))
}
