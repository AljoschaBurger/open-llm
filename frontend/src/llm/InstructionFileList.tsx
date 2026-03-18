import { json } from "node:stream/consumers";
import { useEffect, useState } from "react";
import ModalAdd from "./modals/ModalAdd";
import ModalDelete from "./modals/ModalDelete";
import ModalEdit from "./modals/ModalEdit";

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
    const [activeInstruction, setActiveInstruction] = useState(localStorage.getItem("activeInstruction") ?? "");

    useEffect(() => {
        async function getData() {
            const url = "http://localhost:8080/instructions/all";

            try {
                const response = await fetch(url);
                if (!response.ok){
                    throw new Error(`Response status: ${response.status}`)
                }

                const text = await response.text(); 
                const res = text ? JSON.parse(text) : []; 
                
                setActiveInstruction(localStorage.getItem('activeInstruction') || '');
                setInstructionFiles(res || []);
            } catch(error) {    
                console.error(error);
            }
        }
        getData();
    }, [trigger]);

    

    const handleClick = (index: number, name: string) => {
        if ((activeInstruction === name)) {
            setActiveInstruction("");
            localStorage.setItem("activeInstruction", "");
            return;
        } 

        localStorage.setItem("activeInstruction", name);
        setActiveInstruction(name);
    }

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const handleCloseModalAdd = () => {
      setIsAddModalOpen(false);
    }

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const handleCloseModalDelete = () => {
      setIsDeleteModalOpen(false);
    }

    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const handleCloseEditModal = () => {
      setEditModalOpen(false);
    }


    return (
        <div className="h-[40%] w-[80%]">
            <ModalAdd isOpen={isAddModalOpen} onClose={handleCloseModalAdd} title="Add a new Instruction" setTrigger={setTrigger} trigger={trigger} />
            <ModalDelete isOpen={isDeleteModalOpen} onClose={handleCloseModalDelete} title={"Are you sure your whant to delete the instruction: '" + localStorage.getItem("activeInstruction") + "'"} trigger={trigger} setTrigger={setTrigger} />
            <ModalEdit isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={"Are you sure your whant to delete the instruction: '" + localStorage.getItem("activeInstruction") + "'"} trigger={trigger} setTrigger={setTrigger} instructionName={activeInstruction}/>

            
            <div className="flex overflow-hidden flex-shrink-0 mt-16 flex-col gap-y-4 max-h-[calc(100%-4rem)] w-full bg-gray-800 p-3 rounded-xl relative">
                <button 
                    onClick={onClose} 
                    className="flex justify-center items-center text-2xl rounded-xl text-red-400 absolute top-0 right-2 hover:scale-150 transition-transform duration-100"
                >
                    x
                </button>
                
                <div className="flex gap-y-3 p-4 flex-col items-center overflow-y-scroll max-h-[calc(100%-80px)] font-mono">
                    {
                        instructionFiles.length !== 0 ? (
                            instructionFiles.map((file, index) => (
                                activeInstruction == file.name ? (
                                    <button onClick={() => handleClick(index, file.name)} key={index} className="flex items-center justify-center text-sm h-10 p-3 w-[90%] bg-white border-purple-300 shadow-md shadow-purple-600 border-b-2 rounded-full scale-110 transition-transform duration-200 overflow-hidden flex-shrink-0">{file.name}</button>
                                    ) : (
                                    <button onClick={() => handleClick(index, file.name)} key={index} className="flex items-center justify-center text-sm h-10 border p-3 w-[90%] border-transparent bg-white rounded-full hover:scale-105 transition-transform duration-200 overflow-hidden flex-shrink-0">{file.name}</button>
                                )
                            )
                        )
                        ) : (
                            <span className="text-white overflow-hidden ">No Instructions found</span>
                        )
                    }
                </div>
                <div className="flex justify-center gap-x-2 font-mono">
                    <button onClick={() => setIsAddModalOpen(true)} className="hover:shadow-purple-600 hover:border-fuchsia-100 hover:border-b text-white font-mono w-[30%] p-2 bg-purple-500 shadow-md  shadow-gray-700 rounded-full hover:scale-105 transition-transform duration-200 overflow-auto">Add</button>
                    <button onClick={() => setIsDeleteModalOpen(true)} disabled={instructionFiles.length === 0 || activeInstruction === ""} className={`hover:shadow-purple-600 hover:border-fuchsia-100 hover:border-b text-white font-bold w-[30%] p-2 bg-purple-500 shadow-md disabled:shadow-none disabled:bg-gray-500 disabled:border-none disabled:hover:scale-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50  shadow-gray-700 rounded-full hover:scale-105 transition-transform duration-200 overflow-auto`}>Del</button>
                    <button onClick={() => setEditModalOpen(true)} disabled={instructionFiles.length === 0 || activeInstruction === ""} className="hover:shadow-purple-600 hover:border-fuchsia-100 hover:border-b text-white font-bold w-[30%] p-2 bg-purple-500 shadow-md shadow-gray-700 disabled:shadow-none disabled:bg-gray-500 disabled:border-none disabled:hover:scale-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 rounded-full hover:scale-105 transition-transform duration-200 overflow-auto">Edit</button>
            
                </div>
                </div>
        </div>
    )
}