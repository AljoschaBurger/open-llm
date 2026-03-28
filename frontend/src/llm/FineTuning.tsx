import { useState } from "react";

interface FineTuningProps {
    onClose: () => void;
}

export default function FineTuning({onClose}: FineTuningProps) {
    const [tempInput, setTempInput] = useState<string>(localStorage.getItem("temperature") ||"0.2")
    const [topPInput, setTopPInput] = useState<string>(localStorage.getItem("topP") ||"0.4")
    const [numPredictInput, setNumPredictInput] = useState<string>(localStorage.getItem("numPredict")||"4096")

    const HandleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        localStorage.setItem("temperature", val)
        setTempInput(val);
    };
    const HandleTopPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        localStorage.setItem("topP", val)
        setTopPInput(val);
    };
    const HandleNumPredictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
    
        if (val == "0") {
                val = "1"
        }
        localStorage.setItem("numPredict", val)
        setNumPredictInput(val);
    };

   




    return(
        <div className="bg-gray-800 rounded-lg p-2 h-[43%] w-[90%] flex-shrink-0">
            <button 
                    onClick={onClose} 
                    className="flex justify-center items-center text-2xl rounded-xl text-red-400 absolute top-30 right-6 hover:scale-150 transition-transform duration-100"
            >
                    x
            </button>
            
            <div className="flex flex-col justify-center items-start mt-6 relative">
                <span className="font-mono font-bold text-white" title="Temperature controls the randomness and creativity of the model.. Range (0.0 – 1.5): Lower values (e.g., 0.2) make the output deterministic and focused, ideal for code or facts. Higher values (e.g., 0.8) increase creativity and variety but may lead to hallucinations">Temperature: {tempInput}</span>
                    <div className="flex flex-col w-64 gap-2">
                        <input 
                            type="range"
                            list="temp-markers"
                            value={tempInput}
                            min={0}
                            max={1.5}
                            step={0.1}
                            onChange={HandleTemperatureChange}
                            name="Temp" 
                            placeholder="0.2" 
                            className="p-2 rounded-md mt-1 accent-purple-500 hover:accent-purple-600" 
                        />
                        <datalist id="temp-markers" className="flex text-white justify-between w-full px-1 font-mono relative">
                            <option value="0" label="0" ></option>
                            <option value="0.5" label="0.5" className="ml-5"></option>
                            <option value="1.0" label="1.0" className="ml-4"></option>
                            <option value="1.5" label="1.5" className="top-4"></option>
                        </datalist>
                    </div>
            </div>
            <div className="flex flex-col justify-center items-start mt-6">
                <span className="font-mono font-bold text-white" title="Top-P limits the model's word choice to a cumulative probability 'nucleus'. Range (0.0 – 1.0): At 0.1, the model only picks from the most certain 10% of words, making it very precise. At 0.9, it considers a much wider range of vocabulary. Use lower values to reduce 'noise' and keep the output high-quality.">Top-P: {topPInput}</span>
                <div className="flex flex-col w-64 gap-2">
                    <input 
                        type="range"
                        value={topPInput}
                        list="topP-markers"
                        min={0}
                        max={1}
                        step={0.1}
                        onChange={HandleTopPChange}  
                        name="Temp" 
                        placeholder="0.4" 
                        className="p-2 rounded-md mt-1 accent-purple-500 hover:accent-purple-600" 
                    />
                    <datalist id="topP-markers" className="flex text-white justify-between w-full px-1 font-mono relative">
                        <option value="0" label="0" ></option>
                        <option value="0.5" label="0.5" className="ml-5"></option>
                        <option value="1.0" label="1.0"></option>
                    </datalist>
                </div>
            </div>
             <div className="flex flex-col justify-center items-start mt-6">
                <span className="font-mono font-bold text-white" title="Num Predict sets the maximum length of the generated response. Range (1 – 4096): Defines how many tokens (approx. 0.75 words per token) the model can write before stopping. Set lower for quick answers or higher for long essays and complex code files.">Num Predict: {numPredictInput}</span>
                <div className="flex flex-col w-64 gap-2">
                    <input 
                        type="range"
                        value={numPredictInput}
                        min={0}
                        list="num-predict-markers"
                        max={4096}
                        step={128}
                        onChange={HandleNumPredictChange}
                        name="Temp" 
                        placeholder="256" 
                        className="p-2 rounded-md mt-1 accent-purple-500 hover:accent-purple-600" 
                    />
                    <datalist id="num-predict-markers" className="flex text-white justify-between w-full px-1 font-mono relative">
                        <option value="1" label="1"></option>
                        <option value="2048" label="2048" className="ml-7"></option>
                        <option value="4096" label="4096"></option>
                    </datalist>
                </div>
            </div>
        </div>
    )
}