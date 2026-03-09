import { useEffect, useRef, useState } from "react"

interface RequestProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxHeightPx?: number;
  minRows?: number;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function PromptRequest ({ 
    value,
    onChange,
    placeholder = 'Write with open-llm...',
    maxHeightPx = 180,
    minRows = 1,
    className = '',
    onKeyDown,
}: RequestProps) {
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const [isScrollable, setIsScrollable] = useState(false);

    const resize = () => {
        const el = ref.current;
        if (!el) return;

        el.style.height = "auto";

        const next = el.scrollHeight;

        const clamped = Math.min(next, maxHeightPx);
        el.style.height = `${clamped}px`;

        const shouldScroll = next > maxHeightPx;
        setIsScrollable(shouldScroll);
        el.style.overflowY = shouldScroll ? "auto" : "hidden";
    }

    useEffect(() => {
        resize();
    }, [value, maxHeightPx])

    

    return (
        <textarea
                ref={ref}
                rows={minRows}
                className={["w-[80%] text-black resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-lg leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500", isScrollable ? "overflow-y-auto" : "overflow-y-hidden", className].join(" ")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onInput={resize}
                placeholder={placeholder}
                onKeyDown={onKeyDown} // Pass onKeyDown to the textarea
            />
    )
}
