import { useEffect, useState } from "react";
import ErrorModal from "./ErrorModal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTrigger: (value: boolean) => void;
  trigger: boolean;
}

export default function ModalAdd({ isOpen, onClose, title, setTrigger, trigger }: ModalProps) {

    useEffect(() => {
        if (isOpen) {
        document.body.style.overflow = 'hidden';
        } else {
        document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const [errorMessage, setErrorMessage] = useState("");
    const handleCloseError = () => {
        setErrorMessage("");
    }

    async function handleCreateInstruction(name: string, instruction: string) {

            if (!name.trim() || !instruction.trim()) {
                setErrorMessage("All fields need to be filled");
                return;
            }

            if (name.length > 20) {
                setErrorMessage("Name cannot be longer than 20 characters.");
                return;
            }
    
            const url = "http://localhost:8080/create-instruction"
            try {
                const response = await fetch(url, {
                    method: "POST",
                    body: JSON.stringify({
                        name: name,
                        instruction: instruction
                    })
                })

                if (response.status === 409) {
                    setErrorMessage("ERROR: An instruction with this name already exists!")
                } 
    
                const data = await response.json();
    
                if (data.message === "700") {
                    setErrorMessage("You’ve reached your limit of 6 instructions. Make some room by deleting an old one to continue.");
                
                return;
                    return;
                }
                onClose();
                setNameValue("");
                setInstructionValue("");
                setTrigger(trigger === true ? false : true);
            } catch (error) {
                console.error("Error while trying to create new instruction");
            }
        }


    const [instructionValue, setInstructionValue] = useState('');
    const [nameValue, setNameValue] = useState('');
    const [nameLengthCounter, setNameLengthCounter] = useState<number>(0);

    useEffect(() => {
        setNameLengthCounter(nameValue.length);
    }, [nameValue])

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 w-full flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => {
                            onClose();
                            setInstructionValue("");
                            setNameValue("");
                        }}
        >
            <ErrorModal 
                isOpen={errorMessage !== ""} 
                onClose={handleCloseError} 
                message={errorMessage} 
            />
            <div 
                className="relative flex-shrink-0 h-[90%] w-[70%] p-6 bg-gray-600 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex w-full h-full flex-col items-center gap-y-16 mb-4">
                    <h2 className="text-2xl font-bold font-mono text-white">{title}</h2>
                    <button 
                        onClick={() => {
                            onClose();
                            setInstructionValue("");
                            setNameValue("");
                        }}
                        className="absolute text-2xl right-2 top-2 text-red-500 hover:text-red-400 hover:scale-150 transition-transform duration-100"
                    >
                        ✕
                    </button>
                    <div className="flex justify-center items-center w-full h-12 flex-shrink-0">
                        <textarea
                            className={`flex items-center justify-center w-[80%] h-full rounded-lg p-3`}
                            spellCheck={false}
                            onChange={(e) => {
                                nameLengthCounter < 16 ? setNameValue(e.target.value) : e.target.value < nameValue ? setNameValue(e.target.value) : setNameValue(nameValue)
                            }}
                            value={nameValue}
                            placeholder="Name your instruction file (max. length 20)"
                        >
                        </textarea>
                        <span className={`${nameValue.length >= 16 ? "text-red-500" : "text-white"} absolute right-20 top-32`}>{nameLengthCounter} / 16</span>
                    </div>
                    <textarea
                        spellCheck={false}
                        className="flex flex-shrink-0 w-[80%] h-[60%] rounded-lg p-3"
                        onChange={(e) => setInstructionValue(e.target.value)}
                        value={instructionValue}
                        placeholder="Write an instruction for the llm"
                    >
                    </textarea>
                    <button className="w-[15%] h-[8%] font-bold text-white font-mono bg-green-500 shadow-lg shadow-gray-800 rounded-full hover:scale-110 transition-transform duration-100" onClick={() => handleCreateInstruction(nameValue, instructionValue)}>Add</button>
                </div>
            </div>
        </div>
    )
}