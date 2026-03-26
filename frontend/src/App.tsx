import { useState } from "react";
import Chat from "./llm/chat";

export default function App() {

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Chat />
    </div>
    
  );
}

