import React from 'react';
import { Keyboard } from 'lucide-react';

const Input = ({ customInput, setCustomInput }) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                <Keyboard className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Custom Input (stdin)</h2>
            </div>
            
            <div className="flex-1 relative bg-[#1e1e1e] border-t-0">
                <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input here..."
                    className="w-full h-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none custom-scrollbar"
                    spellCheck="false"
                />
            </div>
        </div>
    );
};

export default Input;
