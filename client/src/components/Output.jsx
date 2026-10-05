import React from 'react';
import { Terminal } from 'lucide-react';

const Output = ({ output, isError, isRunning }) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                <Terminal className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Output</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-sm relative bg-[#1e1e1e] dark:bg-transparent">
                {isRunning ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p>Executing Code...</p>
                        </div>
                    </div>
                ) : output ? (
                    <pre className={`whitespace-pre-wrap ${isError ? 'text-red-500' : 'text-green-400'}`}>
                        {output}
                    </pre>
                ) : (
                    <div className="text-gray-500 dark:text-slate-500 h-full flex items-center justify-center">
                        Click "Run Code" or press Ctrl+Enter to see the output here
                    </div>
                )}
            </div>
        </div>
    );
};

export default Output;
