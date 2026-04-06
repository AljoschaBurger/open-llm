package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Instruction struct {
	Name        string
	Instruction string
}

// struct for the needed functions which are serving the database information
type CreateInstructionStore interface {
	Count() (int, error)
	Exists(name string) (bool, error)
	Save(name, instruction string) error
}

type SQLCreateInstructionStore struct {
	DB *sql.DB
}

// counts the number of enties in the table - returns the number of entries in the table and error (int, error)
func (s *SQLCreateInstructionStore) Count() (int, error) {
	var counter int
	err := s.DB.QueryRow("SELECT COUNT(*) FROM instruction").Scan(&counter)

	return counter, err
}

// checks if name already exists in the instruction table - returns if an entry with the given name (string) already exists (bool) and an error
func (s *SQLCreateInstructionStore) Exists(name string) (bool, error) {
	var exists bool
	err := s.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM instruction WHERE name = ?)", name).Scan(&exists)

	return exists, err
}

// saves the name + instruction (string) in the db - returns an error if failed
func (s *SQLCreateInstructionStore) Save(name, instruction string) error {
	_, err := s.DB.Exec("INSERT INTO instruction (name, instruction) VALUES (?, ?)", name, instruction)

	return err
}

func (s *SQLCreateInstructionStore) CreateTableIfNotExist() error {
	_, err := s.DB.Exec("CREATE TABLE IF NOT EXISTS instruction (name varchar(255) NOT NULL PRIMARY KEY, instruction TEXT NOT NULL)")
	if err != nil {
		return err
	}
	return nil
}

func HandleCreateInstruction(
	store CreateInstructionStore,
	w http.ResponseWriter,
	r *http.Request,
) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req Instruction
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Instruction == "" {
		http.Error(w, "Name and instruction cannot be empty", http.StatusBadRequest)
		return
	}

	// max. count for instructions
	counter, err := store.Count()
	if counter >= 6 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"message": "700"}`)) //shows that there are allready too much entries for instructions (max. 6)
		return
	}

	// checks if the requested entry already exists
	exists, err := store.Exists(req.Name)
	if exists {
		http.Error(w, "Entry already exists", http.StatusConflict)
		return
	}

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// finally stores the entry
	err = store.Save(req.Name, req.Instruction)
	if err != nil {
		http.Error(w, "Unable to insert the given instruction into the database", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"message": "Instruction created successfully"}`))
}
