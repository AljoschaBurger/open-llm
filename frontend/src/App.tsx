import { useState } from "react";
import Chat from "./llm/chat";
import RamUsage from "./llm/RamUsage";

export default function App() {

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Chat />
      <RamUsage />
    </div>
    
  );
}

