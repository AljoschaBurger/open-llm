import { useState } from "react";

interface FineTuningProps {
    onClose: () => void;
}

export default function FineTuning({onClose}: FineTuningProps) {
    const [tempInput, setTempInput] = useState<string>(localStorage.getItem("temperature") ||"0.2")
    const [topPInput, setTopPInput] = useState<string>(localStorage.getItem("topP") ||"0.4")
    const [numPredictInput, setNumPredictInput] = useState<string>(localStorage.getItem("numPredict")||"1000")

    const HandleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
    
        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
            localStorage.setItem("temperature", val)
            setTempInput(localStorage.getItem("temperature") ?? "0.2");
        }
    };
    const HandleTopPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
    
        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
            localStorage.setItem("topP", val)
            setTopPInput(localStorage.getItem("topP") ?? "0.4"); 
        }
    };
    const HandleNumPredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
    
        if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
            localStorage.setItem("numPredict", val)
            setNumPredictInput(localStorage.getItem("numPredict") ?? "1000"); 
        }
    };




    return(
        <div className="bg-gray-800 rounded-lg p-2 h-[40%] w-[90%] flex-shrink-0">
            <button 
                    onClick={onClose} 
                    className="flex justify-center items-center text-2xl rounded-xl text-red-400 absolute top-30 right-6 hover:scale-150 transition-transform duration-100"
            >
                    x
            </button>
            
            <div className="flex flex-col justify-center items-start mt-6 relative">
                
                <span className="font-mono font-bold text-white" title="Temperature controls the randomness of the response. Range (0.0 – 1.0+): Lower values (e.g., 0.2) make the output deterministic and focused, ideal for code or facts. Higher values (e.g., 0.8) increase creativity and variety but may lead to hallucinations">Temperature:</span>
                <div className="flex items-center">
                    <input 
                        type="text"
                        value={tempInput}
                        onChange={HandleTemperatureChange}
                        name="Temp" 
                        placeholder="0.2" 
                        className="p-2 rounded-md mt-1" 
                    />
                    <button className="flex items-center justify-center rounded-full p-1 ml-2 font-mono font-bold bg-purple-500 text-white text-sm h-8 w-14 hover:border-b hover:border-white hover:shadow-md hover:shadow-purple-600 hover:scale-105">Save</button>
                </div>
            </div>
            <div className="flex flex-col justify-center items-start mt-6">
                <span className="font-mono font-bold text-white" title="Top-P sets a cumulative probability threshold for word selection. Range (0.0 – 1.0): At 0.1, the model only considers the top 10% of most likely words. At 0.9, it considers a broader 'nucleus' of words. Use a lower value to prune low-probability 'noise' and keep the output high-quality. ">Top-P:</span>
                <div className="flex items-center">
                    <input 
                        type="text"
                        value={topPInput}
                        onChange={HandleTopPChange}  
                        name="Temp" 
                        placeholder="0.4" 
                        className="p-2 rounded-md mt-1" 
                    />
                    <button className="flex items-center justify-center rounded-full p-1 ml-2 font-mono font-bold bg-purple-500 text-white text-sm h-8 w-14 hover:border-b hover:border-white hover:shadow-md hover:shadow-purple-600 hover:scale-105">Save</button>
                </div>
            </div>
             <div className="flex flex-col justify-center items-start mt-6">
                <span className="font-mono font-bold text-white" title="Num Predict defines the maximum number of tokens (words/parts of words) the model can generate in a single response. Range (-1 or 1+): Set to -1 for unlimited length (constrained only by context window). Use a specific limit (e.g., 256) to prevent long-winded answers or save processing time.">Num Predict:</span>
                <div className="flex items-center">
                    <input 
                        type="text"
                        value={numPredictInput}
                        onChange={HandleNumPredictChange}
                        name="Temp" 
                        placeholder="256" 
                        className="p-2 rounded-md mt-1" 
                    />
                    <button className="flex items-center justify-center rounded-full p-1 ml-2 font-mono font-bold bg-purple-500 text-white text-sm h-8 w-14 hover:border-b hover:border-white hover:shadow-md hover:shadow-purple-600 hover:scale-105">Save</button>
                </div>
            </div>
        </div>
    )
}