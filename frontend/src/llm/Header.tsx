export default function Header() {
    const headerString = "Open-llm";
    const version = "1.0.0"
    return (
        <div className="flex mt-5 items-center gap-x-2 text-white">
            <div className="font-semibold text-xl">{headerString}</div> {version}
        </div>
    )
}