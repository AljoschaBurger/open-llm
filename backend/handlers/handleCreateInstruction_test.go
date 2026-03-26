package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type CreateInstructionStoreMock struct {
	CountFunc  func() (int, error)
	ExistsFunc func(string) (bool, error)
	SaveFunc   func(string, string) error
}

func (m *CreateInstructionStoreMock) Count() (int, error)           { return m.CountFunc() }
func (m *CreateInstructionStoreMock) Exists(n string) (bool, error) { return m.ExistsFunc(n) }
func (m *CreateInstructionStoreMock) Save(n, i string) error        { return m.SaveFunc(n, i) }

func TestHandleCreateInstruction_TableDriven(t *testing.T) {
	// provider
	tests := []struct {
		name           string
		inputPayload   string
		mockCount      int
		mockExists     bool
		expectedStatus int
	}{
		{
			name:           "Success",
			inputPayload:   `{"Name": "Cool Name", "Instruction": "Argh"}`,
			mockCount:      2,
			mockExists:     false,
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "Error - limit reached (6)",
			inputPayload:   `{"Name": "Blah", "Instruction": "Aw man I hope this will not be an error case"}`,
			mockCount:      6,
			mockExists:     false,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Error - name already exists",
			inputPayload:   `{"Name": "Dublette", "Instruction": "skrrr"}`,
			mockCount:      2,
			mockExists:     true,
			expectedStatus: http.StatusConflict,
		},
	}

	var testCounter int
	var errCounter int

	for _, tt := range tests {
		// t.Run creates sub test
		t.Run(tt.name, func(t *testing.T) {
			mock := &CreateInstructionStoreMock{
				CountFunc:  func() (int, error) { return tt.mockCount, nil },
				ExistsFunc: func(n string) (bool, error) { return tt.mockExists, nil },
				SaveFunc:   func(n, i string) error { return nil },
			}

			rr := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/", strings.NewReader(tt.inputPayload))

			// execute handler
			HandleCreateInstruction(mock, rr, req)

			if rr.Code != tt.expectedStatus {
				errCounter++
				t.Errorf("Test '%s' failed: expected %d, got %d", tt.name, tt.expectedStatus, rr.Code)
			} else {
				testCounter++
			}

		})
	}
	fmt.Printf("\nTests Passed: %d/%d | Tests failed: %d/%d", testCounter, len(tests), errCounter, len(tests))
}
