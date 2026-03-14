import { useEffect, useState, useRef, useMemo } from "react";
import PromptRequest from "./request";
import localforage from "localforage";
import Header from "./Header";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import InstructionFileList from "./InstructionFileList";

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
    const [isAtBottom, setIsAtBottom] = useState(true);

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
        updateLocalStorageLength();
        const currentPrompt = prompt;
        setIsAtBottom(true); // Force scroll to bottom when user sends a message
        addPromptToHistory(currentPrompt);
        setPrompt("");

        interface ChatRequest {
          prompt: string;
          instruction?: string;
        }

        const responseId = addResponseToHistory();

        const payload: ChatRequest = { 
          prompt: currentPrompt
        };

        const instruction = localStorage.getItem("activeInstruction");

        if (instruction && instruction.trim() !== "") {
            payload.instruction = instruction;
        }

        console.log(localStorage.getItem("activeInstruction"));

        const response = await fetch("http://localhost:8080/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

    const handleScroll = () => { 
      if (messagesEndRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
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
          console.error("Error while auto saving:", err)
        );
      }
    }, [history]);

    useEffect(() => {
      const loadInitialData = async () => {
        try {
          const savedHistory = await localforage.getItem<ChatEntry[]>('chat_history');
          if (savedHistory) {
            setHistory(savedHistory);
          }
        } catch (err) {
          console.error("Error while loading data from localForage:", err);
        }
      };
      loadInitialData();
    }, []);

    async function clearLocalForage() {
      try {
        await localforage.clear();
        updateLocalStorageLength();
        window.location.reload();
      } catch (err) {
        console.error("Error while trying to clear localforage", err);
      }
    }

    const [localStorageSize, setLocalStorageSize] = useState<number>(0);

    async function updateLocalStorageLength() {
        const length = await localforage.length();
        setLocalStorageSize(length);
    }

    useEffect(() => {
      updateLocalStorageLength();
    }, [history]);

    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <div className="flex flex-row w-full bg-gray-800 justify-center relative">
          
          <div className="flex ml-20 items-center justify-between h-screen flex-col w-[90%]">
            <Header /> 
            {
              history.length !== 0 ? (
                <div ref={messagesEndRef} onScroll={handleScroll} className="flex mt-5 flex-col flex-1 overflow-y-auto w-[70%] p-4 space-y-4 bg-gray-600 rounded-lg">
              {
                history.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg w-[80%] ${item.type === "prompt" ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-gray-800 self-start"}`}
                  >
                    <div className="font-extrabold text-sm mb-1">
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
                                  style={atomDark} // Theme
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
                <div className="flex justify-center bg-gray-300 p-4 text-xl rounded-lg shadow-fuchsia-600 shadow-lg border-2 border-purple-200">Try your local Open-llm instace with a prompt!</div>
              )
            }            
            <div className="flex flex-row mt-10 mb-10 items-center justify-center w-[40%] gap-x-2">
              <PromptRequest  
                value={prompt}
                onChange={setPrompt}
                maxHeightPx={200}
                minRows={1}
                onKeyDown={handleKeyDown}
              />
              <div className="flex ml-2 justify-end mb-1"><button onClick={sendPrompt} disabled={prompt.length === 0} className="disabled:border-none disabled:hover:scale-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 border h-10 text-white font-bold bg-purple-500 shadow-md shadow-purple-800 border-purple-400 rounded-2xl p-2 mt-2 hover:scale-110 transition-transform duration-200">Send</button></div>
              <div className="flex ml-2 justify-end mb-1"><button onClick={clearLocalForage} disabled={Number(localStorageSize) === 0} className="disabled:border-none disabled:hover:scale-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 border h-10 text-white font-bold bg-purple-500 shadow-md shadow-purple-800 border-purple-400 rounded-2xl p-2 mt-2 hover:scale-110 transition-transform duration-200">Clear</button></div>
            </div>
        </div>
        <div className="absolute mt-16 right-10 top-4 bottom-0 flex flex-col items-center w-[12%] border h-[80%] border-gray-600 shadow-sm shadow-purple-800 rounded-lg">
           {
            showInstructions  ? (
              <InstructionFileList onClose={() => {setShowInstructions(false)}}/>
            ) : (
              <button className="flex flex-col gap-y-2 items-center justify-center w-[80%] h-[5%] bg-gray-600 mt-16 p-3 rounded-md hover:scale-110 transition-transform duration-200 text-white" onClick={() => {setShowInstructions(true)}}>Instruction Files</button>
            )
           }
        </div>
        </div>
    )
}
