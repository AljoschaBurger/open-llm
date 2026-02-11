import { useState } from "react";

export default function App() {
  const [output, setOutput] = useState("");

  const sendPrompt = async () => {
    const response = await fetch("http://localhost:8080/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "wie definiert man einen struct in golang? antworte kurz"}), // replace with dynamic value
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value).trim();
      if (!chunkText) continue;
      const lines = chunkText.split("\n");
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.response) {
            setOutput(prev => prev + obj.response);
          }
        } catch (err) {
          console.warn("Invalid JSON chunk:", line);
        }
  }
    }
  };

  return (
    <div>
      <button onClick={sendPrompt}>Send Prompt</button>
      <pre>{output}</pre>
    </div>
  );
}

