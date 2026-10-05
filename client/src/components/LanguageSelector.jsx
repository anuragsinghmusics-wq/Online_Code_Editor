import React, { useState } from 'react';

const languages = [
    // ── WebContainer Projects ──
    { id: 'react',      name: '⚛️ React + Vite',     group: 'webcontainer' },
    { id: 'nodejs',     name: '⚡ Node.js',          group: 'webcontainer' },
    { id: 'express',    name: '🚂 Express.js',       group: 'webcontainer' },
    { id: 'html',       name: '🌐 HTML/CSS/JS',      group: 'webcontainer' },
    // ── Scripting (Piston/Docker) ──
    { id: 'javascript', name: 'JavaScript',          group: 'script' },
    { id: 'typescript', name: 'TypeScript',          group: 'script' },
    { id: 'python',     name: 'Python',              group: 'script' },
    { id: 'java',       name: 'Java',                group: 'script' },
    { id: 'c++',        name: 'C++',                 group: 'script' },
    { id: 'c',          name: 'C',                   group: 'script' },
    { id: 'csharp',     name: 'C#',                  group: 'script' },
    { id: 'rust',       name: 'Rust',                group: 'script' },
    { id: 'go',         name: 'Go',                  group: 'script' },
    { id: 'kotlin',     name: 'Kotlin',              group: 'script' },
    { id: 'php',        name: 'PHP',                 group: 'script' },
    { id: 'ruby',       name: 'Ruby',                group: 'script' },
    { id: 'perl',       name: 'Perl',                group: 'script' },
    { id: 'bash',       name: 'Bash',                group: 'script' },
    { id: 'sqlite3',    name: 'SQL (SQLite)',        group: 'script' },
];

const LanguageSelector = ({ selectedLanguage, onLanguageChange, onGitHubImport }) => {
    let lastGroup = null;
    const [githubUrl, setGithubUrl] = useState('');

    const handleImport = (e) => {
        e.preventDefault();
        if (githubUrl.trim() && onGitHubImport) {
            onGitHubImport(githubUrl.trim());
            setGithubUrl('');
        }
    };

    return (
        <div className="flex flex-col p-3 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full w-56 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 shrink-0 px-1">Templates</h2>
            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 pr-1 pb-2">
                {languages.map((lang) => {
                    const showDivider = lang.group !== lastGroup && lastGroup !== null;
                    lastGroup = lang.group;
                    return (
                        <div key={lang.id}>
                            {showDivider && (
                                <div className="my-1.5 border-t border-gray-200 dark:border-slate-700 mx-1" />
                            )}
                            <button
                                onClick={() => onLanguageChange(lang.id)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-medium text-sm shrink-0
                                    ${selectedLanguage === lang.id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent'
                                    }`}
                            >
                                {lang.name}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* GitHub Importer Section */}
            <div className="mt-2 pt-3 border-t border-gray-200 dark:border-slate-700">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">Import from GitHub</h2>
                <form onSubmit={handleImport} className="flex flex-col gap-2">
                    <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-md transition-colors"
                    >
                        Import Project
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LanguageSelector;
