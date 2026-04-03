import { useEffect, useState } from "react"     

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
        <div className="bg-red-500">
            <switch {...label} onChange={() => setUseTools(!useTool)}>Test</switch>
        </div>
    )
}