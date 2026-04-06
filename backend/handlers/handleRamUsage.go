package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/shirou/gopsutil/v3/mem"
)

type RamInfo struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"usedPercent"`
}

func HandleRamUsage(w http.ResponseWriter, r *http.Request) {
	// VirtualMemory returns statistics about physical memory usage.
	v, err := mem.VirtualMemoryWithContext(r.Context())
	if err != nil {
		log.Printf("Error fetching RAM info: %v", err)
		http.Error(w, "Could not retrieve RAM information", http.StatusInternalServerError)
		return
	}

	info := RamInfo{
		Total:       v.Total,
		Used:        v.Used,
		Free:        v.Free,
		UsedPercent: v.UsedPercent,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}
