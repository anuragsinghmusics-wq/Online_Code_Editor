import React, { useState } from 'react';
import { 
  SiReact, SiNodedotjs, SiExpress, SiHtml5, SiJavascript, SiTypescript, 
  SiPython, SiCplusplus, SiC, SiRust, SiGo, SiKotlin, SiPhp, 
  SiRuby, SiPerl, SiGnubash, SiSqlite 
} from 'react-icons/si';
import { DiJava } from 'react-icons/di';
import { TbBrandCSharp } from 'react-icons/tb';

const templates = [
  { id: 'react',      name: 'React + Vite', icon: <SiReact className="text-blue-400" />, desc: 'Modern React app with instant HMR' },
  { id: 'nodejs',     name: 'Node.js',      icon: <SiNodedotjs className="text-green-500" />, desc: 'Blank Node.js workspace' },
  { id: 'express',    name: 'Express.js',   icon: <SiExpress className="text-gray-400" />, desc: 'Express web server template' },
  { id: 'html',       name: 'HTML/CSS/JS',  icon: <SiHtml5 className="text-orange-500" />, desc: 'Static web project' },
  { id: 'javascript', name: 'JavaScript',   icon: <SiJavascript className="text-yellow-400" />, desc: 'Backend script execution' },
  { id: 'typescript', name: 'TypeScript',   icon: <SiTypescript className="text-blue-500" />, desc: 'Backend script execution' },
  { id: 'python',     name: 'Python',       icon: <SiPython className="text-yellow-500" />, desc: 'Backend script execution' },
  { id: 'java',       name: 'Java',         icon: <DiJava className="text-orange-500 text-4xl" />, desc: 'Backend script execution' },
  { id: 'c++',        name: 'C++',          icon: <SiCplusplus className="text-blue-600" />, desc: 'Backend script execution' },
  { id: 'c',          name: 'C',            icon: <SiC className="text-blue-500" />, desc: 'Backend script execution' },
  { id: 'csharp',     name: 'C#',           icon: <TbBrandCSharp className="text-purple-600" />, desc: 'Backend script execution' },
  { id: 'rust',       name: 'Rust',         icon: <SiRust className="text-orange-600" />, desc: 'Backend script execution' },
  { id: 'go',         name: 'Go',           icon: <SiGo className="text-cyan-500" />, desc: 'Backend script execution' },
  { id: 'kotlin',     name: 'Kotlin',       icon: <SiKotlin className="text-purple-500" />, desc: 'Backend script execution' },
  { id: 'php',        name: 'PHP',          icon: <SiPhp className="text-indigo-400" />, desc: 'Backend script execution' },
  { id: 'ruby',       name: 'Ruby',         icon: <SiRuby className="text-red-600" />, desc: 'Backend script execution' },
  { id: 'perl',       name: 'Perl',         icon: <SiPerl className="text-blue-400" />, desc: 'Backend script execution' },
  { id: 'bash',       name: 'Bash',         icon: <SiGnubash className="text-green-600" />, desc: 'Backend script execution' },
  { id: 'sqlite3',    name: 'SQLite',       icon: <SiSqlite className="text-blue-400" />, desc: 'Database script execution' },
];

const WelcomeScreen = ({ onSelectTemplate, onGitHubImport, theme }) => {
  const [githubUrl, setGithubUrl] = useState('');
  const dark = theme === 'dark';

  const handleImport = (e) => {
    e.preventDefault();
    if (githubUrl.trim() && onGitHubImport) {
      onGitHubImport(githubUrl.trim());
    }
  };

  return (
    <div className={`w-full h-full flex flex-col items-center pt-16 p-8 overflow-y-auto
      ${dark ? 'bg-[#0d1117] text-gray-200' : 'bg-gray-50 text-gray-800'}
    `}>
      <div className="max-w-4xl w-full mt-auto mb-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">What do you want to build?</h1>
          <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Start from a template or import an existing repository.
          </p>
        </div>

        {/* GitHub Import Card */}
        <div className={`mb-12 p-6 rounded-xl border shadow-sm
          ${dark ? 'bg-[#161b22] border-gray-800' : 'bg-white border-gray-200'}
        `}>
          <h2 className="text-lg font-semibold mb-2">Import from GitHub</h2>
          <p className={`text-sm mb-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Paste a public GitHub repository URL to instantly boot a WebContainer development environment.
          </p>
          <form onSubmit={handleImport} className="flex gap-3">
            <input
              type="url"
              placeholder="https://github.com/facebook/react"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className={`flex-1 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${dark ? 'bg-[#0d1117] border border-gray-700 text-white placeholder-gray-500' : 'bg-gray-50 border border-gray-300 text-gray-900'}
              `}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm"
            >
              Import Repository
            </button>
          </form>
        </div>

        {/* Templates Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Start from a Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => onSelectTemplate(tpl.id)}
                className={`flex flex-col items-start p-5 rounded-xl border text-left transition-all hover:-translate-y-1 hover:shadow-md
                  ${dark 
                    ? 'bg-[#161b22] border-gray-800 hover:border-gray-600' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                <div className="text-4xl mb-3 flex items-center justify-center h-10 w-10">{tpl.icon}</div>
                <h3 className="font-semibold text-base mb-1">{tpl.name}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {tpl.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
