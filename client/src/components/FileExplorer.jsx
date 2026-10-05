import React, { useState, useMemo, useCallback, useRef } from 'react';
import ContextMenu from './ContextMenu';
import { 
  VscFolder, VscFolderOpened, VscFile, VscMarkdown, VscJson,
  VscSettingsGear, VscSymbolMisc, VscTerminal
} from 'react-icons/vsc';
import { 
  SiJavascript, SiTypescript, SiReact, SiHtml5, SiCss, SiSass, 
  SiPython, SiGnubash, SiVite, SiNodedotjs, SiYaml, SiCplusplus, 
  SiGo, SiRust, SiPhp
} from 'react-icons/si';

// ─── File icon helper ──────────────────────────────────────────────────────────
const getFileIcon = (name, isFolder = false, isExpanded = false) => {
  if (isFolder) {
    return isExpanded ? <VscFolderOpened className="text-blue-400 text-[15px]" /> : <VscFolder className="text-blue-400 text-[15px]" />;
  }
  
  const ext = (name.split('.').pop() || '').toLowerCase();
  const lowerName = name.toLowerCase();

  // Exact file names
  if (lowerName === 'package.json') return <SiNodedotjs className="text-green-500 text-[14px]" />;
  if (lowerName === 'vite.config.js' || lowerName === 'vite.config.ts') return <SiVite className="text-purple-500 text-[14px]" />;
  
  const map = {
    js: <SiJavascript className="text-yellow-400 text-[14px]" />,
    jsx: <SiReact className="text-blue-400 text-[14px]" />,
    ts: <SiTypescript className="text-blue-500 text-[14px]" />,
    tsx: <SiReact className="text-blue-400 text-[14px]" />,
    html: <SiHtml5 className="text-orange-500 text-[14px]" />,
    css: <SiCss className="text-blue-500 text-[14px]" />,
    scss: <SiSass className="text-pink-500 text-[14px]" />,
    less: <SiSass className="text-blue-700 text-[14px]" />,
    py: <SiPython className="text-yellow-500 text-[14px]" />,
    cpp: <SiCplusplus className="text-blue-600 text-[14px]" />,
    c: <SiCplusplus className="text-blue-500 text-[14px]" />,
    rs: <SiRust className="text-orange-600 text-[14px]" />,
    go: <SiGo className="text-cyan-500 text-[14px]" />,
    php: <SiPhp className="text-indigo-400 text-[14px]" />,
    json: <VscJson className="text-yellow-500 text-[14px]" />,
    xml: <VscSymbolMisc className="text-orange-400 text-[14px]" />,
    yaml: <SiYaml className="text-red-500 text-[14px]" />,
    yml: <SiYaml className="text-red-500 text-[14px]" />,
    md: <VscMarkdown className="text-blue-400 text-[14px]" />,
    txt: <VscFile className="text-gray-400 text-[14px]" />,
    sh: <SiGnubash className="text-green-600 text-[14px]" />,
    bat: <VscTerminal className="text-gray-400 text-[14px]" />,
    svg: <SiHtml5 className="text-orange-500 text-[14px]" />,
  };

  return map[ext] || <VscFile className="text-gray-400 text-[14px]" />;
};

// ─── Build tree from flat file list ────────────────────────────────────────────
function buildFileTree(files) {
  const root = { name: 'root', path: '', type: 'folder', children: {}, isExpanded: true };
  files.forEach(file => {
    const parts = file.name.split('/');
    let cur = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      const curPath = parts.slice(0, i + 1).join('/');
      if (!cur.children[part]) {
        if (isLast && !file.isFolder) {
          cur.children[part] = { name: part, path: file.name, type: 'file' };
        } else {
          cur.children[part] = { name: part, path: curPath, type: 'folder', children: {}, isExpanded: false };
        }
      }
      cur = cur.children[part];
    });
  });
  return root;
}

// ─── Sort: folders first, then alpha ────────────────────────────────────────────
const sortNodes = (nodes) =>
  [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

// ─── FileTreeNode ───────────────────────────────────────────────────────────────
const FileTreeNode = ({
  node, level, activeFile, onFileOpen,
  onRename, onDelete, onDuplicate, onNewFile, onNewFolder,
  theme, selectedFolder, onSelectFolder, toggleExpand,
  draggingPath, onDragStart, onDragEnd, onDragOver, onDrop,
  renamingPath, onRenameSubmit, onRenameCancel,
}) => {
  const isActive = activeFile === node.path;
  const isSelected = selectedFolder === node.path;
  const isRenaming = renamingPath === node.path;
  const renameRef = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      onSelectFolder(node.path);
      toggleExpand(node.path);
    } else {
      onFileOpen(node.path);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onNewFile.__contextMenu(e.clientX, e.clientY, node);
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    onDragStart(node.path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (node.type === 'folder') {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(node.path);
    }
  };

  const handleDrop = (e) => {
    if (node.type === 'folder') {
      e.preventDefault();
      e.stopPropagation();
      onDrop(node.path);
    }
  };

  const isDragTarget = draggingPath && node.type === 'folder' &&
    selectedFolder === node.path && draggingPath !== node.path &&
    !draggingPath.startsWith(node.path + '/');

  const darkActive   = 'bg-blue-600/80 text-white';
  const darkHover    = 'hover:bg-gray-700/60 text-gray-300';
  const darkSelected = 'bg-gray-700/40 text-gray-200';
  const lightActive  = 'bg-blue-100 text-blue-900 font-medium';
  const lightHover   = 'hover:bg-gray-200 text-gray-700';
  const lightSel     = 'bg-gray-200 text-gray-700';

  const rowClass = `group flex items-center gap-1.5 py-[3px] pr-2 cursor-pointer text-sm select-none transition-colors
    ${isDragTarget ? 'ring-1 ring-blue-400 ring-inset rounded' : ''}
    ${isActive && node.type === 'file'
      ? (theme === 'dark' ? darkActive : lightActive)
      : (isSelected && node.type === 'folder')
        ? (theme === 'dark' ? darkSelected : lightSel)
        : (theme === 'dark' ? darkHover : lightHover)
    }`;

  return (
    <div>
      <div
        className={rowClass}
        style={{ paddingLeft: `${level * 14 + 6}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Expand/Collapse chevron for folders */}
        <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center mr-0.5">
          {node.type === 'folder' && (
            <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${node.isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>

        {/* Icon */}
        <div className="flex items-center justify-center w-4 h-4 flex-shrink-0 mr-1.5">
          {getFileIcon(node.name, node.type === 'folder', node.isExpanded)}
        </div>

        {/* Name or inline rename input */}
        {isRenaming ? (
          <input
            ref={renameRef}
            autoFocus
            defaultValue={node.name}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubmit(node, e.target.value.trim());
              if (e.key === 'Escape') onRenameCancel();
            }}
            onBlur={(e) => onRenameSubmit(node, e.target.value.trim())}
            className="flex-1 min-w-0 text-xs px-1 py-0 bg-gray-800 border border-blue-500 rounded outline-none text-white"
          />
        ) : (
          <span className="truncate text-xs flex-1">{node.name}</span>
        )}
      </div>

      {/* Render children if folder is expanded */}
      {node.type === 'folder' && node.isExpanded && (
        <div>
          {sortNodes(Object.values(node.children)).map(child => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              activeFile={activeFile}
              onFileOpen={onFileOpen}
              onRename={onRename}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              theme={theme}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              toggleExpand={toggleExpand}
              draggingPath={draggingPath}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              renamingPath={renamingPath}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main FileExplorer ──────────────────────────────────────────────────────────
const FileExplorer = ({ language, files, setFiles, activeFile, onFileOpen, onFileRename, onFileDelete, onExport, onFilesDrop, theme }) => {
  const [selectedFolder, setSelectedFolder]     = useState('');
  const [expandedFolders, setExpandedFolders]   = useState(new Set(['']));
  const [contextMenu, setContextMenu]            = useState(null); // { x, y, node }
  const [renamingPath, setRenamingPath]          = useState(null);
  const [creating, setCreating]                  = useState(null); // { type, parentFolder }
  const [newItemName, setNewItemName]            = useState('');
  const [draggingPath, setDraggingPath]          = useState(null);
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);
  const createInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Toggle folder expand ──
  const toggleExpand = useCallback((path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  // ── Build memoized tree ──
  const tree = useMemo(() => {
    const root = buildFileTree(files);
    const applyExpanded = (node) => {
      if (node.type === 'folder') {
        node.isExpanded = expandedFolders.has(node.path);
        Object.values(node.children).forEach(applyExpanded);
      }
    };
    applyExpanded(root);
    return root;
  }, [files, expandedFolders]);

  // ── Context menu helpers ──
  const openContextMenu = useCallback((x, y, node = null) => {
    setContextMenu({ x, y, node });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // ── Create file/folder ──
  const startCreate = useCallback((type, parentFolder) => {
    closeContextMenu();
    setCreating({ type, parentFolder: parentFolder ?? selectedFolder });
    setNewItemName('');
    setExpandedFolders(prev => new Set(prev).add(parentFolder ?? selectedFolder));
    setTimeout(() => createInputRef.current?.focus(), 50);
  }, [selectedFolder, closeContextMenu]);

  const commitCreate = useCallback((e) => {
    e && e.preventDefault();
    const name = newItemName.trim();
    if (!name) { setCreating(null); return; }
    const parent = creating?.parentFolder || '';
    const newPath = parent ? `${parent}/${name}` : name;
    if (files.some(f => f.name === newPath)) {
      alert('A file or folder with that name already exists.');
      return;
    }
    if (creating.type === 'file') {
      setFiles([...files, { name: newPath, content: '' }]);
      onFileOpen(newPath);
    } else {
      setFiles([...files, { name: newPath, isFolder: true }]);
    }
    setCreating(null);
    setNewItemName('');
  }, [newItemName, creating, files, setFiles, onFileOpen]);

  // ── Rename ──
  const startRename = useCallback((node) => {
    closeContextMenu();
    setRenamingPath(node.path);
  }, [closeContextMenu]);

  const submitRename = useCallback((node, newName) => {
    setRenamingPath(null);
    if (!newName || newName === node.name) return;
    const parentDir = node.path.includes('/')
      ? node.path.split('/').slice(0, -1).join('/')
      : '';
    const newPath = parentDir ? `${parentDir}/${newName}` : newName;
    if (files.some(f => f.name === newPath)) {
      alert('A file with that name already exists.');
      return;
    }
    const oldPrefix = node.path;
    setFiles(files.map(f => {
      if (f.name === oldPrefix) return { ...f, name: newPath };
      if (f.name.startsWith(oldPrefix + '/')) {
        return { ...f, name: newPath + f.name.slice(oldPrefix.length) };
      }
      return f;
    }));
    if (onFileRename) onFileRename(oldPrefix, newPath);
  }, [files, setFiles, onFileRename]);

  // ── Delete ──
  const handleDelete = useCallback((node) => {
    closeContextMenu();
    if (!window.confirm(`Delete "${node.name}"? This cannot be undone.`)) return;
    if (node.type === 'file') {
      setFiles(files.filter(f => f.name !== node.path));
    } else {
      setFiles(files.filter(f => !f.name.startsWith(node.path + '/') && f.name !== node.path));
    }
    if (onFileDelete) onFileDelete(node.path);
  }, [files, setFiles, closeContextMenu, onFileDelete]);

  // ── Duplicate ──
  const handleDuplicate = useCallback((node) => {
    closeContextMenu();
    const parts = node.path.split('/');
    const lastName = parts.pop();
    const dotIdx = lastName.lastIndexOf('.');
    const baseName = dotIdx > 0 ? lastName.slice(0, dotIdx) : lastName;
    const ext = dotIdx > 0 ? lastName.slice(dotIdx) : '';
    const newName = `${baseName}_copy${ext}`;
    const newPath = [...parts, newName].join('/');
    if (node.type === 'file') {
      const src = files.find(f => f.name === node.path);
      setFiles([...files, { name: newPath, content: src?.content || '' }]);
    } else {
      const copies = files
        .filter(f => f.name.startsWith(node.path + '/'))
        .map(f => ({ ...f, name: newPath + f.name.slice(node.path.length) }));
      setFiles([...files, { name: newPath, isFolder: true }, ...copies]);
    }
  }, [files, setFiles, closeContextMenu]);

  // ── Drag & Drop ──
  const handleDragStart = useCallback((path) => setDraggingPath(path), []);
  const handleDragEnd = useCallback(() => { setDraggingPath(null); }, []);
  const handleDragOver = useCallback((folderPath) => setSelectedFolder(folderPath), []);

  const handleDrop = useCallback((targetFolderPath) => {
    if (!draggingPath) return;
    if (draggingPath === targetFolderPath) return;
    if (targetFolderPath.startsWith(draggingPath + '/')) return; // can't drop into child
    const filename = draggingPath.split('/').pop();
    const newPath = targetFolderPath ? `${targetFolderPath}/${filename}` : filename;
    if (files.some(f => f.name === newPath && f.name !== draggingPath)) {
      alert('A file with that name already exists in the target folder.');
      return;
    }
    const oldPrefix = draggingPath;
    setFiles(files.map(f => {
      if (f.name === oldPrefix) return { ...f, name: newPath };
      if (f.name.startsWith(oldPrefix + '/')) {
        return { ...f, name: newPath + f.name.slice(oldPrefix.length) };
      }
      return f;
    }));
    if (onFileRename) onFileRename(oldPrefix, newPath);
    setDraggingPath(null);
  }, [draggingPath, files, setFiles, onFileRename]);

  // ── Toolbar handlers ──
  const handleNewFile   = () => startCreate('file', selectedFolder);
  const handleNewFolder = () => startCreate('folder', selectedFolder);

  // Attach context menu opener as a static method hack so FileTreeNode can call it
  handleNewFile.__contextMenu = openContextMenu;
  handleNewFolder.__contextMenu = openContextMenu;

  const onBgContextMenu = (e) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, null);
  };

  const handleGlobalDragOver = useCallback((e) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsExternalDragOver(true);
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleGlobalDragLeave = useCallback((e) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsExternalDragOver(false);
    }
  }, []);

  const handleGlobalDrop = useCallback((e) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsExternalDragOver(false);
      
      if (onFilesDrop && e.dataTransfer.items) {
        onFilesDrop(e.dataTransfer.items, selectedFolder);
      }
    }
  }, [onFilesDrop, selectedFolder]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onFilesDrop) {
        onFilesDrop(e.target.files, selectedFolder);
      }
      e.target.value = '';
    }
  }, [onFilesDrop, selectedFolder]);

  const themePanel  = theme === 'dark' ? 'bg-[#0d1117] border-gray-800' : 'bg-gray-50 border-gray-300';
  const themeHeader = theme === 'dark' ? 'border-gray-800' : 'border-gray-300';
  const themeIcon   = theme === 'dark' ? 'text-gray-500 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600';
  const themeInput  = theme === 'dark' ? 'bg-gray-800 text-white border-blue-500' : 'bg-white text-black border-blue-400';
  const dark = theme === 'dark';

  return (
    <div
      className={`w-full h-full flex flex-col border-r select-none relative ${themePanel}`}
      onContextMenu={onBgContextMenu}
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Drag & Drop Overlay */}
      {isExternalDragOver && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]
          ${dark ? 'bg-blue-900/30 border-blue-500/50' : 'bg-blue-100/50 border-blue-400/50'} 
          border-2 border-dashed m-2 rounded-lg pointer-events-none transition-all duration-200`}
        >
          <div className={`px-4 py-3 rounded-lg shadow-xl flex flex-col items-center gap-2
            ${dark ? 'bg-[#2d2d2d] text-blue-400' : 'bg-white text-blue-600'}
          `}>
            <svg className="w-8 h-8 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="font-semibold text-sm">Drop files here</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${themeHeader}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Explorer</span>
        <div className="flex gap-1.5">
          <button title="Upload Files/Folders" onClick={() => fileInputRef.current?.click()} className={`transition-colors ${themeIcon}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            multiple 
            webkitdirectory="true" 
            className="hidden" 
          />
          <button title="New File" onClick={handleNewFile} className={`transition-colors ${themeIcon}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </button>
          <button title="New Folder" onClick={handleNewFolder} className={`transition-colors ${themeIcon}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* GitHub Export Button */}
      {onExport && (
        <div className="px-3 py-2 border-b border-gray-800">
          <button 
            onClick={onExport}
            className={`w-full flex items-center justify-center gap-2 py-1.5 px-2 text-xs font-medium rounded transition-colors
              ${theme === 'dark' ? 'bg-[#2a2d2e] hover:bg-[#37373d] text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-sm'}
            `}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Create a repository
          </button>
        </div>
      )}

      {/* Tree + drop zone */}
      <div
        className="flex-1 overflow-y-auto py-1"
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedFolder(''); }}
        onDragOver={(e) => { e.preventDefault(); setSelectedFolder(''); }}
        onDrop={(e) => { e.preventDefault(); if (draggingPath) handleDrop(''); }}
      >
        {sortNodes(Object.values(tree.children)).map(child => (
          <FileTreeNode
            key={child.path}
            node={child}
            level={0}
            activeFile={activeFile}
            onFileOpen={onFileOpen}
            onRename={startRename}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onNewFile={handleNewFile}
            onNewFolder={handleNewFolder}
            theme={theme}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            toggleExpand={toggleExpand}
            draggingPath={draggingPath}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            renamingPath={renamingPath}
            onRenameSubmit={submitRename}
            onRenameCancel={() => setRenamingPath(null)}
          />
        ))}

        {/* Inline create input */}
        {creating && (
          <div className="px-2 py-0.5" style={{ paddingLeft: `${(creating.parentFolder ? 1 : 0) * 14 + 22}px` }}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{creating.type === 'folder' ? '📁' : '📄'}</span>
              <form onSubmit={commitCreate} className="flex-1">
                <input
                  ref={createInputRef}
                  autoFocus
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={commitCreate}
                  onKeyDown={(e) => e.key === 'Escape' && setCreating(null)}
                  placeholder={creating.type === 'file' ? 'filename.js' : 'folder-name'}
                  className={`w-full text-xs px-1.5 py-0.5 border rounded outline-none ${themeInput}`}
                />
              </form>
            </div>
          </div>
        )}

        {/* Empty state */}
        {files.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-2 mt-8 px-4 text-center">
            <span className="text-3xl">🗂️</span>
            <p className="text-xs text-gray-500">No files yet.<br />Click + to create your first file.</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          theme={theme}
          onClose={closeContextMenu}
          onRename={() => startRename(contextMenu.node)}
          onDelete={() => handleDelete(contextMenu.node)}
          onDuplicate={() => handleDuplicate(contextMenu.node)}
          onNewFile={() => startCreate('file', contextMenu.node?.type === 'folder' ? contextMenu.node.path : selectedFolder)}
          onNewFolder={() => startCreate('folder', contextMenu.node?.type === 'folder' ? contextMenu.node.path : selectedFolder)}
        />
      )}
    </div>
  );
};

export default FileExplorer;
