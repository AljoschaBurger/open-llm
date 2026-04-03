package ollama

type PromptRequest struct {
	Instruction   string  `json:"instruction"` // optional
	CurrentChatId int     `json:"currentChatId"`
	Prompt        string  `json:"prompt"`
	Temperature   float64 `json:"temperature"`
	TopP          float64 `json:"top_p"`
	NumPredict    int     `json:"num_predict"`
}

type OllamaChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
	Options  Options       `json:"options"`
}

type ChatMessage struct {
	Role    string `json:"role"` // "system", "user" oder "assistant"
	Content string `json:"content"`
}

type OllamaChatResponse struct {
	Message ChatMessage `json:"message"`
	Done    bool        `json:"done"`
}

type Options struct {
	Temperature float64 `json:"temperature,omitempty"` // temp. of 0.2 - 0-4 are strict, above more creative
	NumPredict  int     `json:"num_predict,omitempty"` //lenght of the answers
	TopP        float64 `json:"top_p,omitempty"`       // quality filter - 0.1 = only top values (facts) - 0.5 = mixed - 1 = everything is allowed
}

type Tool struct {
	Type     string `json:"type"`
	Function struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Parameters  any    `json:"parameters"`
	} `json:"function"`
}

func FallbackFloat(val float64, def float64) float64 {
	if val <= 0 {
		return def
	}
	return val
}

func FallbackInt(val int, def int) int {
	if val <= 0 {
		return def
	}
	return val
}
