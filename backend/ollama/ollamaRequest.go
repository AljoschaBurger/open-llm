package ollama

const BasicInstruction = `Du bist ein hilfreicher KI-Assistent. Du hast Zugriff auf Tools.
WICHTIGE REGELN FÜR TOOLS:
- Beantworte allgemeine Fragen (wie Programmieren, Geschichte, Smalltalk) DIREKT aus deinem eigenen Wissen.
- Rufe Tools NUR auf, wenn du externe, aktuelle Daten (wie die exakte Uhrzeit) brauchst.

BEISPIELE:
User: "Wie schreibe ich ein Hello World in Python?"
Assistant: (Beantwortet die Frage direkt mit Code, KEIN Tool-Aufruf)

User: "Wie spät ist es gerade in Berlin?"
Assistant: (Ruft das Tool 'get_current_time' auf)

User: "Was ist die Hauptstadt von Frankreich?"
Assistant: "Die Hauptstadt von Frankreich ist Paris." (KEIN Tool-Aufruf)`

type PromptRequest struct {
	Instruction   string  `json:"instruction"`
	CurrentChatId int     `json:"currentChatId"`
	Prompt        string  `json:"prompt"`
	Temperature   float64 `json:"temperature"`
	TopP          float64 `json:"top_p"`
	NumPredict    int     `json:"num_predict"`
	ToolUsage     bool    `json:"tool_usage"`
}

type OllamaChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
	Tools    []Tool        `json:"tools"`
	Options  Options       `json:"options"`
}

type ChatMessage struct {
	Role      string     `json:"role"` // "system", "user" oder "assistant"
	Content   string     `json:"content"`
	ToolCalls []ToolCall `json:"tool_calls"`
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

type ToolCall struct {
	Function struct {
		Name string                 `json:"name"`
		Args map[string]interface{} `json:"arguments"`
	} `json:"function"`
}

type ChatResponseChunk struct {
	Model   string      `json:"model"`
	Message ChatMessage `json:"message"`
	Done    bool        `json:"done"`
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
