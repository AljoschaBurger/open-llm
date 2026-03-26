package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type DeleteInstructionStoreMock struct {
	CountEntriesMock func(name string) (int, error)
	DeleteMock       func(name string) error
}

func (m *DeleteInstructionStoreMock) CountEntries(n string) (int, error) {
	return m.CountEntriesMock(n)
}

func (m *DeleteInstructionStoreMock) Delete(n string) error {
	return m.DeleteMock(n)
}

func TestHandleDeleteInstruction_Table_Driven(t *testing.T) {
	tests := []struct {
		name           string
		inputPayload   string
		countMock      int
		countError     error
		deleteMock     error
		expectedStatus int
	}{
		{
			name:           "Success",
			inputPayload:   `{"Name": "SuccessTest", "Instruction": "Blah Blah"}`,
			countMock:      1,
			countError:     nil,
			deleteMock:     nil,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Fail - Entry isn't existing",
			inputPayload:   `{"Name": "Foo", "Instruction": "Bar"}`,
			countMock:      0,
			countError:     nil,
			deleteMock:     nil,
			expectedStatus: 400,
		},
	}

	var testCounter int
	var errCounter int

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &DeleteInstructionStoreMock{
				CountEntriesMock: func(n string) (int, error) { return tt.countMock, tt.countError },
				DeleteMock:       func(n string) error { return tt.deleteMock },
			}

			rr := httptest.NewRecorder()
			req := httptest.NewRequest("DELETE", "/", strings.NewReader(tt.inputPayload))

			HandleDeleteInstruction(mock, rr, req)

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
