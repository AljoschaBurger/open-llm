package handler_test

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/AljoschaBurger/open-llm/handler"
)

// Testet POST + Streaming
func TestHandlePrompt_Streaming(t *testing.T) {
	// Mock Server starten
	mock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("Token1\nToken2\nToken3\n"))
	}))
	defer mock.Close()

	// Überschreibe die BaseURL für den Test
	oldURL := handler.OllamaBaseURL
	handler.OllamaBaseURL = mock.URL
	defer func() { handler.OllamaBaseURL = oldURL }()

	req := httptest.NewRequest(http.MethodPost, "/prompt", bytes.NewBufferString(`{"prompt":"Hallo Welt"}`))
	w := httptest.NewRecorder()

	handler.HandlePrompt(w, req)

	resp := w.Result()
	defer resp.Body.Close()
	bodyBytes, _ := io.ReadAll(resp.Body)
	body := string(bodyBytes)

	if !strings.Contains(body, "Token1") || !strings.Contains(body, "Token3") {
		t.Errorf("Expected streamed tokens, got: %s", body)
	}
}
