package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
)

func HandleDeleteInstruction(
	db *sql.DB,
	w http.ResponseWriter,
	r *http.Request,
) {

	log.Println("Ist in delete")

	if r.Method != http.MethodDelete {
		http.Error(w, "Only DELETE is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req Instruction
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid Request", http.StatusBadRequest)
		return
	}

	log.Printf("Name von Instruction: %s", req.Name)

	var counter int

	err := db.QueryRow("select count(*) from instruction where name = ?", req.Name).Scan(&counter)
	if err != nil {
		http.Error(w, "Error while trying to delete instruction which doesn't exist", http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("delete from instruction where name = ?", req.Name)
	if err != nil {
		http.Error(w, "Error while trying to delete instruction", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message": "Instruction deleted successfully"}`))
}
