export default function Header() {
    const headerString = "Open-llm";
    const version = "Beta"
    return (
        <div className="flex text-md mt-5 items-end gap-x-2 text-white">
            <div className="font-semibold text-4xl">{headerString}</div> {version}
        </div>
    )
}