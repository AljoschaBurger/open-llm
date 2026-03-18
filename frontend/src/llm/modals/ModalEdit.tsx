import { useEffect, useState, useRef } from "react";
import ErrorModal from "./ErrorModal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTrigger: (value: boolean) => void;
  trigger: boolean;
  instructionName: string;
}

export default function ModalEdit({ isOpen, onClose, title, setTrigger, trigger, instructionName }: ModalProps) {

    const oldName = useRef<string>("");

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

    


    const [instructionValue, setInstructionValue] = useState('');
    const [nameValue, setNameValue] = useState('');
    const [nameLengthCounter, setNameLengthCounter] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setNameLengthCounter(nameValue.length);
    }, [nameValue])


    useEffect(() => {

        if (!isOpen) {
            setIsLoading(false);
            return
        };

        const activeName = localStorage.getItem('activeInstruction') || "";
        // Merke dir den Namen für den UPDATE-Request (oldName)
        oldName.current = activeName;
        setNameValue(activeName)

        
        async function getDataFromSpecificInstruction() {
            setIsLoading(true);
            try {
                const url = `http://localhost:8080/instruction/specific?name=${encodeURIComponent(activeName)}`;
                const response = await fetch(url, {
                    method: "GET",
                })

                const res = await response.json();

                if (!response.ok) {
                    throw new Error(res.error || "Fehler beim Laden");
                }

                if (res.instruction) {
                    setInstructionValue(res.instruction);
                }
            } catch (error: any) {
                setErrorMessage(error.message);
            } finally {
                setIsLoading(false);
            }
        }
        if (activeName) {
            getDataFromSpecificInstruction();
        }
    }, [isOpen])


    async function updateInstruction() {
        const url = 'http://localhost:8080/instruction/update';

        const payload = {
            oldName: oldName.current,
            newName: nameValue,
            newInstruction: instructionValue
        }

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setErrorMessage("Response error while trying to update database");
                console.error(errorMessage + errorData);
                return;
            }
            
            localStorage.setItem('activeInstruction', nameValue);
            setTrigger(!trigger);
            onClose();
        } catch (error) {
            console.error("Error while trying to update database", error);
            setErrorMessage("Network error while trying to store edits");
        }
    }

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 w-full flex items-center justify-center bg-black/50 backdrop-blur-sm h-full"
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
            {
                isLoading && errorMessage == "" ? (
                    <div className="flex flex-col justify-center items-center w-full h-full gap-y-10">
                        <div className="border-8 w-52 h-52 border-t-fuchsia-500 rounded-full border-gray-300 animate-spin"></div>
                        <span className="font-extrabold text-white text-2xl">Loading . . .</span>
                    </div>
                ) : (
                    <div 
                className="relative h-[70%] w-[70%] p-6 bg-gray-600 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex w-full h-full flex-col items-center gap-y-16 mb-4">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
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
                                nameLengthCounter < 20 ? setNameValue(e.target.value) : e.target.value < nameValue ? setNameValue(e.target.value) : setNameValue(nameValue)
                            }}
                            value={nameValue}
                            placeholder="Name your instruction file (max. length 20)"
                        >
                        </textarea>
                        <span className={`${nameValue.length >= 20 ? "text-red-500" : "text-white"} absolute right-32 top-32`}>{nameLengthCounter} / 20</span>
                    </div>
                    <textarea
                        spellCheck={false}
                        className="flex flex-shrink-0 w-[80%] h-[60%] rounded-lg p-3"
                        onChange={(e) => setInstructionValue(e.target.value)}
                        value={instructionValue}
                        placeholder="Write an instruction for the llm"
                    >
                    </textarea>
                    <button onClick={() => updateInstruction()} className="w-[5%] h-[5%] bg-green-500 shadow-lg shadow-gray-800 rounded-full hover:scale-110 transition-transform duration-100" >Update</button>
                </div>
            </div>
                )
            }
        </div>
    )
}