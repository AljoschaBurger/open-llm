import { json } from "node:stream/consumers";
import { useEffect, useState } from "react";

interface instructionFile {
    name: string,
    instruction: string,
}

interface InstructionFileListProps {
    onClose: () => void;
}

export default function InstructionFileList({ onClose }: InstructionFileListProps) {

    const [instructionFiles, setInstructionFiles] = useState<instructionFile[]>([]);
    const [trigger, setTrigger] = useState(false);

    useEffect(() => {
        // call to get the instruction files from the database
        async function getData() {
            const url = "http://localhost:8080/instructions/all";

            try {
                const response = await fetch(url);
                if (!response.ok){
                    throw new Error(`Response status: ${response.status}`)
                }

                const res = await response.json();
                setInstructionFiles(res);
            } catch(error) {
                console.error(error);
            }
        }
        getData();
    }, [trigger]);

    const [activeInstruction, setActiveInstruction] = useState(localStorage.getItem("activeInstruction") ?? "");

    const handleClick = (index: number) => {
        if (activeInstruction === String(index)) {
            setActiveInstruction("");
            localStorage.setItem("activeInstruction", "");
            return;
        } 

        localStorage.setItem("activeInstruction", String(index));
        setActiveInstruction(String(index));
    }

    async function handleCreateInstruction() {
        let name = "blah";
        let instruction = "üOIASJDÜOFJ";

        const url = "http://localhost:8080/create-instruction"
        try {
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify({
                    name: name,
                    instruction: instruction
                })
            })

            const data = await response.json();

            if (data.message === "700") {
                console.log("Zu viele Einträge");
                return;
            }
            setTrigger(trigger === true ? false : true);
        } catch (error) {
            console.error("Error while trying to create new instruction");
        }
    }

    return (
        <div className="h-full w-[80%]">
            <button 
                onClick={onClose} 
                className="flex justify-center items-center text-2xl rounded-xl text-red-400 absolute top-10 right-2 hover:scale-150 transition-transform duration-100"
            >x</button>
            <div className="flex mt-16 flex-col gap-y-5 bg-gray-600 p-3 rounded-md relative">
                
                <div className="flex gap-y-2 p-4 flex-col items-center h-max-64 overflow-y-auto">
                    {
                        instructionFiles.length !== 0 ? (
                            instructionFiles.map((file, index) => (
                                activeInstruction == String(index) ? (
                                    <button onClick={() => handleClick(index)} key={index} className="text-sm p-3 w-[90%] bg-white border-sky-600 border-4 rounded-md scale-110 transition-transform duration-200 overflow-hidden">{file.name}</button>
                                ) : (
                                    <button onClick={() => handleClick(index)} key={index} className="text-sm border p-3 w-[90%] border-transparent bg-white rounded-md hover:scale-105 transition-transform duration-200 overflow-hidden">{file.name}</button>
                                )
                            )
                        )
                        ) : (
                            <span className="text-white ">No Instructions found</span>
                        )
                    }
                </div>
                <div className="flex justify-center gap-x-2">
                    <button onClick={() => handleCreateInstruction()} className="w-[30%] border p-2 bg-green-400 shadow-lg border-green-700 shadow-gray-700 rounded-md hover:scale-105 transition-transform duration-200 overflow-auto">Add</button>
                    <button onClick={() => handleCreateInstruction()} className="w-[30%] border p-2 bg-red-400 shadow-lg border-red-700 shadow-gray-700 rounded-md hover:scale-105 transition-transform duration-200 overflow-auto">Del</button>
                    <button onClick={() => handleCreateInstruction()} className="w-[30%] border p-2 bg-orange-400 shadow-lg border-orange-700 shadow-gray-700 rounded-md hover:scale-105 transition-transform duration-200 overflow-auto">Edit</button>
            
                </div>
                </div>
        </div>
    )
}