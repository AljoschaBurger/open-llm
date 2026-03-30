import { useEffect, useState, useRef, useMemo } from "react";
import PromptRequest from "./request";
import localforage from "localforage";
import Header from "./Header";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import InstructionFileList from "./InstructionFileList";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ChatList from "./ChatList";
// @ts-ignore
import 'katex/dist/katex.min.css';
import FineTuning from "./FineTuning";

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
    const [prompting, setPrompting] = useState(false);

    const addPromptToHistory = (currentPrompt: string): number => {
      const newId: number = Date.now();
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
      const newId: number = Date.now() + 1;
      const newResponse: Response = {
        id: newId,
        type: "response",
        content: "",
      };

      setHistory((prevHistory) => [...prevHistory, newResponse]);
      return newId;
    }

    const abortControllerRef = useRef<AbortController | null>(null);

    const sendPrompt = async () => {
        updateLocalStorageLength();
        const currentPrompt = prompt;
        setIsAtBottom(true); // Force scroll to bottom when user sends a message
        addPromptToHistory(currentPrompt);
        setPrompt("");

        interface ChatRequest {
          prompt: string;
          instruction?: string;
          temperature: number;
          top_p: number;
          num_predict: number;
        }

        const responseId = addResponseToHistory();

        // watchdog to check if somethin whent wrong while llm anwsers (timeout)
        let lastChunkReceivedAt = Date.now();
        let isFinished = false;

        const TIMEOUT_MS = 10000;

        const payload: ChatRequest = { 
          prompt: currentPrompt,
          temperature: parseFloat(localStorage.getItem("temperature") || ""),
          top_p: parseFloat(localStorage.getItem("topP") || ""),
          num_predict: parseInt(localStorage.getItem("numPredict") || ""),
        };

        const instruction = localStorage.getItem("activeInstruction");

        if (instruction && instruction.trim() !== "") {
            payload.instruction = instruction;
        }


        const controller = new AbortController();
        abortControllerRef.current = controller;

        setPrompting(true);

        const response = await fetch("http://localhost:8080/ask", {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          setPrompting(false);
          setHistory(prev => prev.map(entry => 
              entry.id === responseId ? { ...entry, content: "⚠️ An Error occured while calling the llm ⚠️" } : entry
          ));

          return;
        }
    
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        const timeoutWatcher = setInterval(() => {
            const timeSinceLastChunk = Date.now() - lastChunkReceivedAt;
            if (!isFinished && timeSinceLastChunk > TIMEOUT_MS) {
                console.error("LLM Stream stalled");
                reader.cancel(); // Cuts the connection
                setPrompting(false);
                clearInterval(timeoutWatcher);
                
                setHistory(prev => prev.map(entry => 
                    entry.id === responseId && entry.content === "" 
                        ? { ...entry, content: "⚠️ Connection timeout, please try again ⚠️" } 
                        : entry
                ));
            }
        }, 2000);
    
        try {
          while (true) {
              const { value, done } = await reader.read();

              if (done) {
                isFinished = true;
                setPrompting(false);
                break
              };
              
              lastChunkReceivedAt = Date.now(); // update timestamp
              const chunkText = decoder.decode(value).trim();

              if (!chunkText) {
                continue
              };

              const lines = chunkText.split("\n");
              for (const line of lines) {
                try {
                  const obj = JSON.parse(line);
                  if (obj.done) {
                    isFinished = true;
                    setPrompting(false);
                    // here maybe a copy button?
                  }

                  const newContent = obj.message?.content;

                  if (newContent) {
                      setHistory(prevHistory => {
                        return prevHistory.map(entry => 
                          entry.id === responseId && entry.type === "response"
                            ? { ...entry, content: entry.content + newContent }
                            : entry
                        );
                      });
                    }
                } catch (err) {
                  console.warn("Invalid JSON chunk:", line);
                }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
        isFinished = true;
        setPrompting(false);
        clearInterval(timeoutWatcher);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
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

    const handleStopClick = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
      
    

    const [showInstructions, setShowInstructions] = useState(false);
    const [showFineTuning, setShowFineTuning] = useState(false);

    return (
        <div className="flex flex-row w-full bg-gray-900 justify-center relative">
          
          <div className="flex ml-20 items-center justify-between h-screen flex-col w-[90%]">
            <Header /> 
            {
              history.length !== 0 ? (
                <ChatList 
                  history={history} 
                  messagesEndRef={messagesEndRef} 
                  handleScroll={handleScroll} 
                />
              ) : (
                <div className="flex justify-center bg-gray-300 p-4 text-xl rounded-lg shadow-fuchsia-600 shadow-lg border-b-2 border-purple-100 animate-bounce font-mono">Try your local Open-llm instace with a prompt!</div>
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
              <div className="flex ml-2 justify-end mb-1"><button onClick={sendPrompt} disabled={prompt.length === 0} className="disabled:shadow-none disabled:border-none disabled:hover:scale-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:border-b border-purple-300  h-10 text-white font-mono bg-purple-500 shadow-md hover:shadow-purple-600 rounded-2xl p-2 mt-2 hover:scale-110 transition-transform duration-200">Send</button></div>
              <div className="flex ml-2 justify-end mb-1"><button onClick={clearLocalForage} disabled={Number(localStorageSize) === 0} className="disabled:shadow-none disabled:border-none disabled:hover:scale-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:border-b border-purple-300 h-10 text-white font-mono bg-purple-500 shadow-md hover:shadow-purple-600 rounded-2xl p-2 mt-2 hover:scale-110 transition-transform duration-200">Clear</button></div>
              {
                prompting ? (
                  <div className="flex ml-2 justify-end mb-1"><button onClick={handleStopClick} className="h-10 w-10 animate-pulse text-white font-mono bg-red-500 shadow-md rounded-2xl p-2 mt-2 hover:scale-110 transition-transform duration-200">&#9633;</button></div>
                ) : (
                  <div className="flex ml-2 justify-end mb-1"></div>
                )
              }
            </div>
        </div>
        <div className="hidden overflow-hidden flex-shrink-1 absolute right-4 mb-32 bottom-0 xl:flex flex-col items-center justify-start w-[13%] h-[78%] bg-gray-transparent rounded-xl border-b-white border-b border-t border-r border-l shadow-fuchsia-600 shadow-xl">
           {
            showInstructions  ? (
              <InstructionFileList onClose={() => {setShowInstructions(false)}} />
            ) : (
              <button className="flex flex-col gap-y-2 mb-8 items-center justify-center w-[80%] h-[8%] bg-gray-800 font-bold mt-8 text-sm xl:text-md p-10 overflow-y-hidden xl:p-2 rounded-xl hover:scale-110 transition-transform duration-200 text-white font-mono" onClick={() => {setShowInstructions(true)}}>Instruction Files</button>
            )
           }
           {
            showFineTuning ? (
              <FineTuning onClose={() => {setShowFineTuning(false)}} />
            ) : (
              <button className="flex flex-col gap-y-2  items-center justify-center w-[80%] h-[8%] bg-gray-800 font-bold text-sm xl:text-md p-10 overflow-y-hidden xl:p-2 rounded-xl hover:scale-110 transition-transform duration-200 text-white font-mono" onClick={() => {setShowFineTuning(true)}}>Fine-Tuning</button>
            )
           }
        </div>
      </div>
    )
}
