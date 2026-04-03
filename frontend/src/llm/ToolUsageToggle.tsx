import { useEffect, useState } from "react";

import Switch from '@mui/material/Switch';



const label = { inputProps: { 'aria-label': 'Switch demo' } };


export default function ToolUsageToggle() {

    const [useTool, setUseTools] = useState(false);

    useEffect(() => {

        if (useTool) {

            localStorage.setItem("useTool", "true");

        } else {

            localStorage.setItem("useTool", "false");

        }

    }, [useTool]);


    return (

        <div className="flex justify-between items-center w-[80%] bg-gray-800 rounded-lg mt-2 p-3">

            <span className="text-white font-mono">Tool Usage</span><Switch {...label} onChange={() => setUseTools(!useTool)} />

        </div>

    )

}