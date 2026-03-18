import { useEffect, useState } from "react";
import ErrorModal from "./ErrorModal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  setTrigger: (value: boolean) => void;
  trigger: boolean;
}

export default function ModalDelete({ isOpen, onClose, title, setTrigger, trigger }: ModalProps) {

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

    const [clickCounter, setClickCounter] = useState<number>(0);

    async function handleDeleteInstruction() {
        try {
            const payload = {name: localStorage.getItem("activeInstruction")}
        
            const response = await fetch("http://localhost:8080/instruction/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            await response.json();

            if (!response.ok) {
                console.error("Could not delete instruction");
                setErrorMessage("An Error occurred while trying to delete the instruction");
            }

            if (response.ok) {
                localStorage.setItem("activeInstruction", "");
                setTrigger(!trigger);
                onClose();
            }

            
        } catch (error) {
            console.error("Error while trying to delete instruction", error);
        }
    }


    

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 w-full flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => onClose()}
        >
            <ErrorModal 
                isOpen={errorMessage !== ""} 
                onClose={handleCloseError} 
                message={errorMessage}
                isDelete={true} 
            />
            <div 
                className="relative h-[30%] w-[70%] p-6 bg-gray-600 border border-gray-700 rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex w-full h-full flex-col justify-center items-center gap-y-5 mb-4">
                    <h2 className="text-2xl font-bold text-white">{title} ?</h2>
                    <button 
                        onClick={() => onClose()}
                        className="absolute text-2xl right-2 top-1 text-red-500 hover:text-red-400 hover:scale-150 transition-transform duration-100"
                    >
                        ✕
                    </button>
                    
                    <div className="flex w-full h-full flex-row justify-center items-center gap-x-16 mb-4">
                        <button className="w-[10%] h-[15%] bg-purple-500 font-bold text-white shadow-lg shadow-gray-800 rounded-full hover:scale-110 transition-transform duration-100" onClick={() => handleDeleteInstruction()}>Delete</button>
                        <button className="w-[10%] h-[15%] bg-red-500 font-bold text-white shadow-lg shadow-gray-800 rounded-full hover:scale-110 transition-transform duration-100" onClick={() => onClose()}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    )
}