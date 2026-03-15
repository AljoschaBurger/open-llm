import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  isDelete?: boolean
}

export default function ErrorModal({ isOpen, onClose, message, isDelete}: ModalProps) {

    useEffect(() => {
        if (isOpen) {
        document.body.style.overflow = 'hidden';
        } else {
        document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] w-full flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={onClose}
        >
            <div 
                className="relative h-[30%] w-[50%] p-6 bg-gray-800 border-2 border-red-500 rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex flex-col items-center justify-center h-full">
                    <h2 className="text-xl font-bold text-red-500">{message}</h2>
                    <button onClick={onClose} className="flex font-bold shadow-lg shadow-gray-900 items-center justify-center mt-8 p-3 w-[5%] bg-red-500 text-white rounded-xl hover:scale-110">
                        OK
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}