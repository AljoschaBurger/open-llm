export default function Header() {
    const headerString = "Open-llm";
    const version = "Beta"
    return (
        <div className="flex text-md mt-4 items-end gap-x-2 text-white font-mono">
            <div className="font-semibold text-5xl">{headerString}</div> <div className="flex justify-end items-end mb-1">{version}</div>
        </div>
    )
}