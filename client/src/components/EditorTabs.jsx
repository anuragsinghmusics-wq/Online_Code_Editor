import React, { useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

// ─── Map file extension → Monaco language ─────────────────────────────────────
const EXT_TO_LANG = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', less: 'less',
  py: 'python', rb: 'ruby', php: 'php',
  java: 'java', kt: 'kotlin', cs: 'csharp',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c', h: 'cpp',
  rs: 'rust', go: 'go', swift: 'swift',
  json: 'json', jsonc: 'json', json5: 'json',
  xml: 'xml', svg: 'xml',
  yaml: 'yaml', yml: 'yaml',
  md: 'markdown', markdown: 'markdown',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  sql: 'sql', graphql: 'graphql',
  r: 'r', pl: 'perl', lua: 'lua',
};

const getMonacoLang = (filePath, fallbackLang = 'javascript') => {
  if (!filePath) return fallbackLang;
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return EXT_TO_LANG[ext] || fallbackLang;
};

// ─── File icon ─────────────────────────────────────────────────────────────────
const FILE_ICONS = {
  js: '🟨', jsx: '⚛️', ts: '🔷', tsx: '⚛️',
  html: '🌐', css: '🎨', py: '🐍', java: '☕',
  cpp: '⚙️', c: '⚙️', rs: '🦀', go: '🐹', rb: '💎',
  json: '📋', md: '📝', sh: '🔧', sql: '🗄️',
};
const getFileIcon = (name) => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return FILE_ICONS[ext] || '📄';
};

// ─── Single Tab ─────────────────────────────────────────────────────────────────
const Tab = ({ path, isActive, isDirty, onActivate, onClose, theme }) => {
  const filename = path.split('/').pop();
  const dark = theme === 'dark';
  return (
    <div
      title={path}
      onClick={onActivate}
      className={`
        group flex items-center gap-1.5 px-3 h-full border-r cursor-pointer
        flex-shrink-0 min-w-0 max-w-[160px] relative transition-colors
        ${dark ? 'border-gray-800' : 'border-gray-300'}
        ${isActive
          ? (dark ? 'bg-[#1e1e1e] text-white' : 'bg-white text-gray-900')
          : (dark ? 'bg-[#2d2d2d] text-gray-400 hover:bg-[#252525]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
        }
      `}
    >
      {/* Active indicator line at top */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 rounded-b" />
      )}
      <span className="text-xs leading-none flex-shrink-0">{getFileIcon(filename)}</span>
      <span className="text-xs truncate">{filename}</span>
      {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0" />}
      <button
        title="Close tab"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className={`
          ml-auto w-4 h-4 flex items-center justify-center rounded
          opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs
          ${dark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'}
          ${isActive ? 'opacity-60' : ''}
        `}
      >
        ×
      </button>
    </div>
  );
};

// ─── EditorTabs ────────────────────────────────────────────────────────────────
const EditorTabs = ({
  openTabs,        // string[]
  activeTab,       // string | null
  onTabActivate,   // (path: string) => void
  onTabClose,      // (path: string) => void
  language,        // language selector value (fallback)
  files,           // { name, content }[]
  setCode,         // (newContent: string) => void
  theme,
  onRun,
  editorSettings,
}) => {
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
  const activeFile  = files?.find(f => f.name === activeTab);
  const editorRef   = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
    // Auto-save shortcut: Ctrl+S does nothing (already auto-saved), just block browser save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});
  };

  const dark = theme === 'dark';

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* ── Tab Bar ── */}
      <div
        className={`flex h-9 overflow-x-auto flex-shrink-0 border-b
          ${dark ? 'bg-[#2d2d2d] border-gray-800' : 'bg-gray-100 border-gray-300'}
        `}
        style={{ scrollbarWidth: 'none' }}
      >
        {openTabs.length === 0 ? (
          <div className={`flex items-center px-3 text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
            Open a file from the Explorer →
          </div>
        ) : (
          openTabs.map(tabPath => (
            <Tab
              key={tabPath}
              path={tabPath}
              isActive={tabPath === activeTab}
              isDirty={false}
              onActivate={() => onTabActivate(tabPath)}
              onClose={() => onTabClose(tabPath)}
              theme={theme}
            />
          ))
        )}
      </div>

      {/* ── Monaco Editor ── */}
      <div className="flex-1 min-h-0">
        {activeTab && activeFile ? (
          <MonacoEditor
            key={activeTab}
            height="100%"
            language={getMonacoLang(activeTab, language)}
            theme={monacoTheme}
            value={activeFile.content || ''}
            onChange={(val) => setCode(val || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: editorSettings?.fontSize || 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              minimap: { enabled: !!editorSettings?.minimap },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: !!editorSettings?.formatOnPaste,
              formatOnType: false,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoIndent: 'full',
              matchBrackets: 'always',
              padding: { top: 12, bottom: 12 },
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              wordWrap: editorSettings?.wordWrap ? 'on' : 'off',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              acceptSuggestionOnEnter: 'smart',
            }}
          />
        ) : (
          <div className={`h-full flex flex-col items-center justify-center gap-4 ${dark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
            <div className="text-6xl opacity-20">⌨️</div>
            <div className="text-center">
              <p className={`text-sm font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                No file open
              </p>
              <p className={`text-xs mt-1 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                Select a file from the Explorer to start editing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorTabs;
