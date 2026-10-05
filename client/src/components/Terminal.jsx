import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Square } from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const Terminal = ({ onStop, isRunning, terminalRef }) => {
    const containerRef = useRef(null);
    const xtermRef = useRef(null);

    useEffect(() => {
        // Initialize xterm
        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#1e293b', // slate-800
                foreground: '#f8fafc', // slate-50
                cursor: '#38bdf8'      // sky-400
            },
            fontFamily: 'Fira Code, monospace',
            fontSize: 14,
            rows: 15
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(containerRef.current);
        fitAddon.fit();
        term.write('Welcome to the Live Terminal!\r\nPress "Run Code" above to execute your scripts.\r\n');
        
        xtermRef.current = term;
        if (terminalRef) {
            terminalRef.current = term;
        }

        // Handle resize
        const observer = new ResizeObserver(() => {
            if (containerRef.current && containerRef.current.offsetWidth > 0) {
                fitAddon.fit();
            }
        });
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        // Clean up on unmount
        return () => {
            observer.disconnect();
            term.dispose();
        };
    }, [terminalRef]);

    return (
        <div className="flex flex-col h-full bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-5 h-5 text-sky-400" />
                    <h2 className="text-sm font-semibold text-slate-300">Live Terminal Console</h2>
                </div>
                {isRunning && (
                    <button
                        onClick={onStop}
                        className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                    >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        Stop Process
                    </button>
                )}
            </div>
            
            <div className="flex-1 p-4 bg-slate-800 overflow-hidden relative">
                <div ref={containerRef} className="w-full h-full" />
            </div>
        </div>
    );
};

export default Terminal;
