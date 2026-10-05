import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import ActivityBar from './components/ActivityBar';
import WelcomeScreen from './components/WelcomeScreen';
import FileExplorer from './components/FileExplorer';
import EditorTabs from './components/EditorTabs';
import Terminal from './components/Terminal';
import BrowserPreview from './components/BrowserPreview';
import ResizablePanels from './components/ResizablePanels';
import GitHubExportModal from './components/GitHubExportModal';
import SettingsModal from './components/SettingsModal';
import DependenciesPane from './components/DependenciesPane';
import { DEFAULT_CODE, ENTRY_FILES } from './constants';
import io from 'socket.io-client';
import { projectManager } from './services/ProjectManager';
import { processDroppedItems, processFileInput } from './utils/fileDrop';

const SOCKET_URL = 'http://localhost:5000';

function App() {
  // ── Language & File System ────────────────────────────────────────────────────
  const [language, setLanguage] = useState(null);
  const [fileSystem, setFileSystem] = useState({});

  // ── Editor Tabs State ─────────────────────────────────────────────────────────
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabPath, setActiveTabPath] = useState(null);

  // ── UI State ──────────────────────────────────────────────────────────────────
  const [isRunning, setIsRunning]       = useState(false);
  const [theme, setTheme]               = useState('dark');
  const [activePanel, setActivePanel]   = useState('terminal'); // 'terminal' | 'preview'
  const [showPreview, setShowPreview]   = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Settings & Sidebar state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer'); // 'explorer' | 'dependencies'
  const [editorSettings, setEditorSettings] = useState(() => {
    const saved = localStorage.getItem('editorSettings');
    return saved ? JSON.parse(saved) : {
      fontSize: 16,
      wordWrap: false,
      minimap: false,
      formatOnPaste: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('editorSettings', JSON.stringify(editorSettings));
  }, [editorSettings]);

  // Dev server state (Node.js project mode)
  const [devServerStatus, setDevServerStatus] = useState('idle');  // idle | installing | starting | ready | error
  const [devServerPort, setDevServerPort]     = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────────
  const socketRef  = useRef(null);
  const terminalRef = useRef(null);

  // ── Load / save theme ─────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setTheme(saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    else setTheme('light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  // ── Socket setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('output', ({ data }) => {
      if (terminalRef.current) {
        terminalRef.current.write(data.replace(/\r?\n/g, '\r\n'));
      }
    });

    socketRef.current.on('exit', ({ code }) => {
      setIsRunning(false);
      if (terminalRef.current) {
        terminalRef.current.write(`\r\n\x1b[36m[Process exited with code ${code}]\x1b[0m\r\n`);
      }
    });

    // ── Node.js project events ──
    socketRef.current.on('install-complete', () => {
      setDevServerStatus('starting');
    });

    socketRef.current.on('install-error', ({ code }) => {
      setDevServerStatus('error');
      setIsRunning(false);
    });

    socketRef.current.on('dev-server-starting', ({ script }) => {
      setDevServerStatus('starting');
      setActivePanel('preview');
    });

    // ── WebContainer setup ──
    projectManager.setCallbacks({
      onTerminalOutput: (data) => {
        if (terminalRef.current) {
          terminalRef.current.write(data);
        }
      },
      onStatusChange: (status) => {
        setDevServerStatus(status);
        if (status === 'error') {
          setIsRunning(false);
        }
      }
    });

    import('./services/WebContainerService').then(({ webContainerService }) => {
      webContainerService.setServerReadyHandler((port, url) => {
        setDevServerPort(url); // Store the full URL for WebContainer
        setDevServerStatus('ready');
        setTimeout(() => setActivePanel('preview'), 500);
      });
    });

    return () => socketRef.current?.disconnect();
  }, []);

  // Hook terminal input → socket
  useEffect(() => {
    if (!socketRef.current) return;
    let disposable;
    const tid = setInterval(() => {
      if (terminalRef.current) {
        clearInterval(tid);
        disposable = terminalRef.current.onData((data) => {
          const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(language);
          const isPtyMode = language === 'nodejs' || isWebContainer; // PTY implies raw data needed
          
          if (isWebContainer) {
            projectManager.writeToProcess(data);
            return;
          }

          const payload = isPtyMode ? data : (data === '\r' ? '\n' : data);
          socketRef.current.emit('input', { data: payload });
          
          if (!isPtyMode) {
            if (data === '\r') terminalRef.current.write('\r\n');
            else if (data === '\x7f') terminalRef.current.write('\b \b');
            else if (data.charCodeAt(0) >= 32) terminalRef.current.write(data);
          }
        });

        // Send terminal resize events so the PTY adjusts its column width
        const resizeObserver = new ResizeObserver(() => {
          const term = terminalRef.current;
          if (term && term.cols && term.rows) {
            socketRef.current.emit('terminal-resize', { cols: term.cols, rows: term.rows });
          }
        });
        const el = terminalRef.current?.element?.parentElement;
        if (el) resizeObserver.observe(el);
      }
    }, 100);
    return () => { disposable?.dispose(); clearInterval(tid); };
  }, [language]);

  // ── Language change ───────────────────────────────────────────────────────────
  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    
    // Check if it's a webcontainer template
    const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(newLang);
    
    if (isWebContainer) {
      // 1. Load files instantly
      const files = projectManager.loadTemplate(newLang);
      setFileSystem(prev => ({ ...prev, [newLang]: files }));
      
      // Reset tabs for new language
      const entry = files[0]?.name || 'package.json';
      setOpenTabs([entry]);
      setActiveTabPath(entry);
      
      // 2. Auto run and switch to terminal
      setIsRunning(true);
      setActivePanel('terminal');
      setDevServerStatus('installing');
      setDevServerPort(null);
      if (terminalRef.current) {
        terminalRef.current.clear();
      }
      
      // 3. Boot project in background
      projectManager.bootProject(newLang).catch(e => {
        setIsRunning(false);
      });
      return;
    }

    if (!fileSystem[newLang]) {
      setFileSystem(prev => ({
        ...prev,
        [newLang]: [{ name: ENTRY_FILES[newLang], content: DEFAULT_CODE[newLang] }]
      }));
    }
    // Reset tabs for new language
    const entry = ENTRY_FILES[newLang];
    setOpenTabs([entry]);
    setActiveTabPath(entry);
  }, [fileSystem]);

  // ── GitHub Import ─────────────────────────────────────────────────────────────
  const handleGitHubImport = useCallback(async (url) => {
    try {
      setLanguage('react'); // default to react language identifier for webcontainer types
      setIsRunning(true);
      setActivePanel('terminal');
      setDevServerStatus('booting');
      setDevServerPort(null);
      if (terminalRef.current) {
        terminalRef.current.clear();
        terminalRef.current.write(`\x1b[1;34mFetching from GitHub...\x1b[0m\r\n`);
      }

      const { githubService } = await import('./services/GitHubService');
      
      const { tree, flatFiles } = await githubService.fetchRepo(url, (msg) => {
        if (terminalRef.current) terminalRef.current.write(`\x1b[36m${msg}\x1b[0m\r\n`);
      });

      // Update UI
      setFileSystem(prev => ({ ...prev, ['react']: flatFiles }));
      
      const entry = flatFiles[0]?.name || 'package.json';
      setOpenTabs([entry]);
      setActiveTabPath(entry);

      // Boot
      await projectManager.bootCustomProject(tree);
    } catch (err) {
      setIsRunning(false);
      setDevServerStatus('error');
      if (terminalRef.current) {
        terminalRef.current.write(`\r\n\x1b[31m[GitHub Import Error] ${err.message}\x1b[0m\r\n`);
      }
    }
  }, []);

  // ── Tab management ────────────────────────────────────────────────────────────
  const handleFileRename = useCallback((oldPath, newPath) => {
    setOpenTabs(prev => {
      if (!prev.some(p => p === oldPath || p.startsWith(oldPath + '/'))) return prev;
      return prev.map(p => p === oldPath ? newPath : p.startsWith(oldPath + '/') ? newPath + p.slice(oldPath.length) : p);
    });
    if (activeTabPath === oldPath) {
      setActiveTabPath(newPath);
    } else if (activeTabPath && activeTabPath.startsWith(oldPath + '/')) {
      setActiveTabPath(newPath + activeTabPath.slice(oldPath.length));
    }
  }, [activeTabPath]);

  const handleFileDelete = useCallback((deletedPath) => {
    setOpenTabs(prev => {
      const remaining = prev.filter(p => p !== deletedPath && !p.startsWith(deletedPath + '/'));
      if (activeTabPath === deletedPath || (activeTabPath && activeTabPath.startsWith(deletedPath + '/'))) {
        setActiveTabPath(remaining.length > 0 ? remaining[Math.min(prev.indexOf(activeTabPath), remaining.length - 1)] || remaining[0] : null);
      }
      return remaining;
    });
  }, [activeTabPath]);

  const handleFileOpen = useCallback((filePath) => {
    setOpenTabs(prev => {
      if (prev.includes(filePath)) return prev;
      return [...prev, filePath];
    });
    setActiveTabPath(filePath);
  }, []);

  const handleTabActivate = useCallback((filePath) => {
    setActiveTabPath(filePath);
  }, []);

  const handleTabClose = useCallback((filePath) => {
    setOpenTabs(prev => {
      const idx     = prev.indexOf(filePath);
      const newTabs = prev.filter(t => t !== filePath);
      if (filePath === activeTabPath) {
        if (newTabs.length > 0) {
          setActiveTabPath(newTabs[Math.min(idx, newTabs.length - 1)]);
        } else {
          setActiveTabPath(null);
        }
      }
      return newTabs;
    });
  }, [activeTabPath]);

  // ── setCode for active tab ────────────────────────────────────────────────────
  const handleSetCode = useCallback((newContent) => {
    if (!activeTabPath) return;
    setFileSystem(prev => ({
      ...prev,
      [language]: (prev[language] || []).map(f =>
        f.name === activeTabPath ? { ...f, content: newContent } : f
      )
    }));

    // If it's a webcontainer, sync file to virtual FS instantly for HMR
    const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(language);
    if (isWebContainer) {
      import('./services/WebContainerService').then(({ webContainerService }) => {
        if (webContainerService.instance) {
          // ensure directory exists
          const parts = activeTabPath.split('/');
          const dir = parts.slice(0, -1).join('/');
          if (dir) {
            webContainerService.instance.fs.mkdir(dir, { recursive: true }).then(() => {
               webContainerService.instance.fs.writeFile(activeTabPath, newContent);
            });
          } else {
             webContainerService.instance.fs.writeFile(activeTabPath, newContent);
          }
        }
      });
    }
  }, [activeTabPath, language]);

  // ── Drag & Drop OS files ──────────────────────────────────────────────────────
  const handleFilesDrop = useCallback(async (items, targetFolder = '') => {
    if (!language) return;
    try {
      // Determine if items is a FileList (from input) or DataTransferItemList (from drop)
      const isFileList = items instanceof FileList;
      const extractedFiles = isFileList 
        ? await processFileInput(items) 
        : await processDroppedItems(items);
        
      if (!extractedFiles.length) return;

      const newFiles = [];
      const wcPromises = [];

      // Adjust paths relative to target folder and prepare them for insertion
      extractedFiles.forEach((file) => {
        const finalPath = targetFolder ? `${targetFolder}/${file.name}` : file.name;
        
        if (file.isFolder) {
          newFiles.push({ name: finalPath, isFolder: true });
        } else {
          // If it's binary, WebContainer supports Uint8Array natively for writing!
          newFiles.push({ name: finalPath, content: file.content instanceof Uint8Array ? '' : file.content }); // Content stored empty for UI if binary
          
          const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(language);
          if (isWebContainer) {
            wcPromises.push(
              import('./services/WebContainerService').then(({ webContainerService }) => {
                if (webContainerService.instance) {
                  const parts = finalPath.split('/');
                  const dir = parts.slice(0, -1).join('/');
                  if (dir) {
                    return webContainerService.instance.fs.mkdir(dir, { recursive: true }).then(() => {
                      return webContainerService.instance.fs.writeFile(finalPath, file.content);
                    });
                  } else {
                    return webContainerService.instance.fs.writeFile(finalPath, file.content);
                  }
                }
              })
            );
          }
        }
      });

      // Update UI state
      setFileSystem(prev => {
        const existing = prev[language] || [];
        // Filter out existing files with same paths to replace them
        const filtered = existing.filter(ex => !newFiles.some(nf => nf.name === ex.name));
        return {
          ...prev,
          [language]: [...filtered, ...newFiles]
        };
      });

      // Execute all WebContainer writes
      await Promise.all(wcPromises);
    } catch (err) {
      console.error('Failed to process dropped files:', err);
      alert('Error processing dropped files.');
    }
  }, [language]);

  // ── Run / Stop ────────────────────────────────────────────────────────────────
  const handleRunCode = useCallback(() => {
    const currentFiles = fileSystem[language];
    if (isRunning || !currentFiles?.length) return;
    
    setIsRunning(true);
    setActivePanel('terminal');

    const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(language);
    
    if (isWebContainer) {
      setDevServerStatus('booting');
      setDevServerPort(null);
      terminalRef.current?.clear();
      projectManager.bootProject(language).catch(e => {
        setIsRunning(false);
      });
      return;
    }

    // Reset dev server state for a fresh run
    setDevServerStatus('idle');
    setDevServerPort(null);
    if (language === 'nodejs') {
      setDevServerStatus('installing');
    }
    terminalRef.current?.clear();
    terminalRef.current?.write(`\x1b[1;34mRunning ${language}...\x1b[0m\r\n`);
    socketRef.current.emit('run', { language, files: currentFiles });
  }, [fileSystem, language, isRunning]);

  const handleStopCode = useCallback(() => {
    const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(language);
    if (isWebContainer) {
       // Ideally we would kill the current WebContainer process.
       // For now we just reset state and let user re-run
       setIsRunning(false);
       setDevServerStatus('idle');
       setDevServerPort(null);
       if (terminalRef.current) {
         terminalRef.current.write('\r\n\x1b[33m[Stopped by user]\x1b[0m\r\n');
       }
       return;
    }
    socketRef.current?.emit('stop');
  }, [language]);

  const currentFiles = fileSystem[language] || [];
  const dark = theme === 'dark';

  return (
    <div className={`h-screen flex flex-col ${dark ? 'bg-[#1e1e1e] text-gray-100' : 'bg-[#f3f3f3] text-gray-900'} transition-colors duration-200 ${theme}`}>
      {/* ── Navbar ── */}
      <Navbar
        isRunning={isRunning}
        onRun={handleRunCode}
        theme={theme}
        toggleTheme={toggleTheme}
        showPreview={showPreview}
        togglePreview={() => setShowPreview(prev => !prev)}
        isProjectLoaded={!!language}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Activity Bar (Left-most) ── */}
        <ActivityBar
          theme={theme}
          isProjectLoaded={!!language}
          activeTab={activeSidebarTab}
          onTabChange={setActiveSidebarTab}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onHomeClick={() => {
            // Cleanly exit to home
            setLanguage(null);
            setDevServerStatus('idle');
            setDevServerPort(null);
            if (terminalRef.current) terminalRef.current.clear();
          }}
        />

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex overflow-hidden">
          {!language ? (
            /* ── Welcome Screen ── */
            <WelcomeScreen 
              theme={theme}
              onSelectTemplate={handleLanguageChange}
              onGitHubImport={handleGitHubImport}
            />
          ) : (
            /* ── IDE Workspace Layout ── */
            <ResizablePanels
              direction="horizontal"
              minSizes={showPreview ? [12, 30, 20] : [12, 30]} // Explorer, Editor+Terminal, Preview
              initialSizes={showPreview ? [16, 55, 29] : [16, 84]} // Default distribution
              className="flex-1 overflow-hidden"
            >
              {/* Panel 1: Sidebar (Explorer / Dependencies) */}
              <div className={`h-full overflow-hidden border-r flex flex-col ${dark ? 'border-[#333333]' : 'border-gray-300'}`}>
                {activeSidebarTab === 'explorer' ? (
                  <FileExplorer
                    language={language}
                    files={currentFiles}
                    setFiles={(newFiles) => setFileSystem(prev => ({ ...prev, [language]: newFiles }))}
                    activeFile={activeTabPath}
                    onFileOpen={handleFileOpen}
                    onFileRename={handleFileRename}
                    onFileDelete={handleFileDelete}
                    onExport={() => setIsExportModalOpen(true)}
                    onFilesDrop={handleFilesDrop}
                    theme={theme}
                  />
                ) : (
                  <DependenciesPane
                    files={currentFiles}
                    theme={theme}
                    language={language}
                  />
                )}
              </div>

              {/* Panel 2: Editor (Top) & Terminal (Bottom) */}
              <div className="h-full overflow-hidden flex flex-col">
                <ResizablePanels
                  direction="vertical"
                  minSizes={[20, 10]} // Editor minimum, Terminal minimum
                  initialSizes={[70, 30]} // Editor takes 70%, Terminal takes 30%
                  className="w-full h-full"
                >
                  {/* Top: Editor */}
                  <div className={`h-full overflow-hidden border-b ${dark ? 'border-[#333333]' : 'border-gray-300'}`}>
                    <EditorTabs
                      openTabs={openTabs}
                      activeTab={activeTabPath}
                      onTabActivate={handleTabActivate}
                      onTabClose={handleTabClose}
                      language={language}
                      files={currentFiles}
                      setCode={handleSetCode}
                      theme={theme}
                      onRun={handleRunCode}
                      editorSettings={editorSettings}
                    />
                  </div>

                  {/* Bottom: Terminal */}
                  <div className="h-full overflow-hidden flex flex-col relative">
                    <div className={`flex items-center px-4 py-1 text-[11px] font-semibold uppercase tracking-widest ${dark ? 'bg-[#181818] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      Terminal
                    </div>
                    <div className={`flex-1 relative ${dark ? 'bg-[#0d1117]' : 'bg-white'}`}>
                       <Terminal
                        isRunning={isRunning}
                        onStop={handleStopCode}
                        terminalRef={terminalRef}
                      />
                    </div>
                  </div>
                </ResizablePanels>
              </div>

              {/* Panel 3: Browser Preview */}
              {showPreview && (
                <div className={`h-full overflow-hidden border-l ${dark ? 'border-[#333333]' : 'border-gray-300'}`}>
                  <BrowserPreview
                    files={currentFiles}
                    theme={theme}
                    devServerPort={devServerPort}
                    devServerStatus={devServerStatus}
                    language={language}
                  />
                </div>
              )}
            </ResizablePanels>
          )}
        </div>
      </div>
      {/* GitHub Export Modal */}
      <GitHubExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        files={currentFiles}
        theme={theme}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={editorSettings}
        onSettingsChange={setEditorSettings}
        theme={theme}
      />
    </div>
  );
}

export default App;
