import { useEffect, useState } from "react";
import PromptRequest from "./request";

export default function Chat() {
    const [output, setOutput] = useState("");
    const [input, setInput] = useState("");
    
      const sendPrompt = async () => {
        addNewPrompt();
        const t = text;
        setText("");

        const response = await fetch("http://localhost:8080/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
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

    const [text, setText] = useState("");

    const addNewPrompt = () => {
      const newId: number = prompts.length > 0 
        ? Math.max(...prompts.map(p => p.id)) + 1
        : 1;

      let content = text;

      const newPrompt: Prompt = {
        id: newId,
        content: content,
      };      

      setPrompts((prevPrompts) => {
        return [...prevPrompts, newPrompt];
      });
    };

    type Prompt = {
      id: number,
      content: string
    }

    const [prompts, setPrompts] = useState<Prompt[]>([]);

    return (
        <div className="flex items-center justify-between h-screen flex-col w-full bg-green-500">    
            <div>
              <div className="w-96 h-32 border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                {output}  
              </div> 
            </div>

            <div>
              {
                prompts.map(prompt => (
                  <div
                    key={prompt.id}
                  >
                    {prompt.content}
                  </div>
                ))
              }
            </div>
            
            <div className="flex flex-col mb-10 items-center justify-center w-[80%]">
              <PromptRequest  
                value={text}
                onChange={setText}
                maxHeightPx={200}
                minRows={1}
              />
              <div className="flex w-[80%] justify-end mr-3"><button onClick={sendPrompt} className="border border-md border-black rounded-lg p-1 mt-2 bg-white">Send</button></div>
            </div>
        </div>
    )
}
