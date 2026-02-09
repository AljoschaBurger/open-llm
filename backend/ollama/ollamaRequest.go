package ollama

type PromptRequest struct {
	InstructionFile string `json:"instruction"` // optional
	CurrentChatId   int    `json:"currentChatId"`
	Prompt          string `json:"prompt"`
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}
