import React from 'react';
import { Play, Sun, Moon, Code2, PanelRightOpen, PanelRightClose } from 'lucide-react';

const Navbar = ({ isRunning, onRun, theme, toggleTheme, showPreview, togglePreview, isProjectLoaded }) => {
    const dark = theme === 'dark';
    return (
        <nav className={`flex items-center justify-between px-4 py-2 border-b transition-colors duration-200 shadow-sm z-20
            ${dark ? 'bg-[#181818] border-[#333333]' : 'bg-white border-gray-200'}
        `}>
            <div className="flex items-center gap-2">
                <Code2 className="w-6 h-6 text-blue-500" />
                <h1 className={`text-sm font-semibold tracking-wide ${dark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Online Code Editor
                </h1>
            </div>
            
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className={`p-1.5 rounded-md transition-colors
                        ${dark ? 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}
                    `}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>

                {isProjectLoaded && (
                    <>
                        <button
                            onClick={togglePreview}
                            className={`p-1.5 rounded-md transition-colors
                                ${dark ? 'bg-[#2d2d2d] text-gray-400 hover:text-gray-200' : 'bg-gray-100 text-gray-600 hover:text-gray-900'}
                            `}
                            title={showPreview ? "Close Preview" : "Open Preview"}
                        >
                            {showPreview ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                        </button>
                        
                        <button
                            onClick={onRun}
                            disabled={isRunning}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold text-white transition-all
                                ${isRunning 
                                    ? 'bg-blue-500/50 cursor-not-allowed text-blue-100' 
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-sm'}`}
                        >
                            {isRunning ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-[1.5px] border-white border-t-transparent rounded-full animate-spin"></div>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Run Code
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
