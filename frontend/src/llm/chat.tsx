import { useEffect, useState, useRef } from "react";
import PromptRequest from "./request";
import localforage from "localforage";
import Header from "./Header";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Chat() {
    type Prompt = {
      id: number,
      type: "prompt",
      content: string,
    }

    type Response = {
      id: number,
      type: "response",
      content: string,
    }

    type ChatEntry = Prompt | Response;

    const [history, setHistory] = useState<ChatEntry[]>([]);
    const [prompt, setPrompt] = useState("");
    const [isAtBottom, setIsAtBottom] = useState(true); // New state for scroll position

    const getNextId = (): number => {
      return history.length > 0 
        ? Math.max(...history.map(p => p.id)) + 1
        : 1;
    }

    const addPromptToHistory = (currentPrompt: string): number => {
      const newId: number = getNextId();
      const newPrompt: Prompt = {
        id: newId,
        type: "prompt",
        content: currentPrompt,
      };      

      setHistory((prevHistory) => {
        return [...prevHistory, newPrompt];
      });
      return newId;
    };

    const addResponseToHistory = (): number => {
      const newId: number = getNextId();
      const newResponse: Response = {
        id: newId,
        type: "response",
        content: "",
      };

      setHistory((prevHistory) => [...prevHistory, newResponse]);
      return newId;
    }

    const sendPrompt = async () => {
        const currentPrompt = prompt;
        setIsAtBottom(true); // Force scroll to bottom when user sends a message
        addPromptToHistory(currentPrompt);
        setPrompt("");

        const responseId = addResponseToHistory();

        const response = await fetch("http://localhost:8080/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentPrompt }),
        });
    
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
    
        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break
          };
    
          const chunkText = decoder.decode(value).trim();

          if (!chunkText) {
            continue
          };

          const lines = chunkText.split("\n");
          for (const line of lines) {
            try {
              const obj = JSON.parse(line);
              if (obj.response) {
                setHistory(prevHistory => {
                  return prevHistory.map(entry => 
                    entry.id === responseId && entry.type === "response"
                      ? { ...entry, content: entry.content + obj.response }
                      : entry
                  );
                });
              }
            } catch (err) {
              console.warn("Invalid JSON chunk:", line);
            }
        }
    }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        if (prompt.trim() !== '') {
          event.preventDefault();
          sendPrompt();
        }
      }
    }

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      }
    };

    const handleScroll = () => { // New handleScroll function
      if (messagesEndRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
        // Check if user is at the very bottom, with a small tolerance
        const atBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
        setIsAtBottom(atBottom);
      }
    };

    useEffect(() => {
      if (isAtBottom) { // Only auto-scroll if currently at the bottom
        scrollToBottom();
      }
    }, [history, isAtBottom]);

    useEffect(() => {
      if (history.length > 0) {
        localforage.setItem('chat_history', history).catch(err => 
          console.error("Fehler beim automatischen Speichern:", err)
        );
      }
    }, [history]);

    // 2. Einmaliges Laden beim Start der App
    useEffect(() => {
      const loadInitialData = async () => {
        try {
          const savedHistory = await localforage.getItem<ChatEntry[]>('chat_history');
          if (savedHistory) {
            setHistory(savedHistory);
          }
        } catch (err) {
          console.error("Fehler beim Laden aus localForage:", err);
        }
      };
      loadInitialData();
    }, []);

    async function clearLocalForage() {
      try {
        await localforage.clear();
        window.location.reload();
      } catch (err) {
        console.error("Error while trying to clear localforage", err);
      }
    }

    return (
        <div className="flex items-center justify-between h-screen flex-col w-full bg-gray-800 gap-y-4">   
            <Header /> 
            {
              history.length !== 0 ? (
                <div ref={messagesEndRef} onScroll={handleScroll} className="flex mt-5 flex-col flex-1 overflow-y-auto w-[70%] p-4 space-y-4 bg-gray-700 rounded-lg">
              {
                history.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg w-[80%] ${item.type === "prompt" ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-gray-800 self-start"}`}
                  >
                    <div className="font-bold text-sm mb-1">
                        {item.type === "prompt" ? "You" : "Open-llm"}
                    </div>
                    {
                      item.content !== "" ? (
                        <ReactMarkdown
                          children={item.content}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  children={String(children).replace(/\n$/, '')}
                                  style={atomDark} // Hier das Theme zuweisen
                                  language={match[1]}
                                  PreTag="div"
                                  {...props}
                                />
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        />
                      ) : (
                        <div>Loading...</div>
                      )
                    }
                  </div>
                ))
              
              }
            </div>
              ) : (
                <div className="flex justify-center bg-gray-300 p-4 text-xl rounded-lg shadow-fuchsia-600 shadow-lg">Try your local Open-llm instace with a prompt!</div>
              )
            }
            
            <div className="flex flex-row mb-10 items-center justify-center w-[40%]">
              <PromptRequest  
                value={prompt}
                onChange={setPrompt}
                maxHeightPx={200}
                minRows={1}
                onKeyDown={handleKeyDown}
              />
              <div className="flex ml-2 justify-end mr-3"><button onClick={sendPrompt} className="border border-md border-black rounded-lg p-1 mt-2 bg-white">Send</button></div>
              <div className="flex ml-2 justify-end mr-3"><button onClick={clearLocalForage} className="border border-md border-black rounded-lg p-1 mt-2 bg-white">Clear</button></div>
            </div>
        </div>
    )
}
