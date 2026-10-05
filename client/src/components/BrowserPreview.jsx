import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// ─── Resolve relative href from current page ────────────────────────────────────
function resolveHref(currentPage, href) {
  if (!href) return null;
  if (href.startsWith('#')) return null;     // anchor — ignore
  if (href.startsWith('http')) return null;  // external — ignore
  if (href.startsWith('mailto')) return null;

  const currentDir = currentPage?.includes('/')
    ? currentPage.split('/').slice(0, -1).join('/')
    : '';

  let resolved = href;
  if (href.startsWith('/')) {
    resolved = href.replace(/^\/+/, '');
  } else if (href.startsWith('./')) {
    resolved = currentDir ? `${currentDir}/${href.slice(2)}` : href.slice(2);
  } else if (href.startsWith('../')) {
    let parts = currentDir ? currentDir.split('/') : [];
    let rest = href;
    while (rest.startsWith('../')) { parts.pop(); rest = rest.slice(3); }
    resolved = [...parts, rest].filter(Boolean).join('/');
  } else {
    resolved = currentDir ? `${currentDir}/${href}` : href;
  }

  return resolved.replace(/\/+/g, '/'); // clean double slashes
}

// ─── Build srcDoc for a given page ─────────────────────────────────────────────
function buildSrcDoc(files, currentPage) {
  if (!files || !currentPage) return '';
  const pageFile = files.find(f => f.name === currentPage);
  if (!pageFile) return '';

  const pageDir = currentPage.includes('/')
    ? currentPage.split('/').slice(0, -1).join('/')
    : '';

  const resolve = (rel) => {
    if (!rel) return null;
    const cleaned = rel.replace(/^\.\//, '');
    if (cleaned.startsWith('/')) return cleaned.slice(1);
    return pageDir ? `${pageDir}/${cleaned}` : cleaned;
  };

  let html = pageFile.content || '';

  // Inject nav interceptor
  const navScript = `<script>
(function(){
  document.addEventListener('click', function(e){
    var el = e.target;
    while(el && el.tagName !== 'A') el = el.parentElement;
    if(el && el.getAttribute('href')){
      var h = el.getAttribute('href');
      if(h && !h.startsWith('http') && !h.startsWith('mailto') && !h.startsWith('#')){
        e.preventDefault();
        window.parent.postMessage({type:'ide-navigate', href:h}, '*');
      }
    }
  }, true);
})();
<\/script>`;

  // Inline CSS <link href="...">
  html = html.replace(/<link\s+[^>]*href=["']([^"']*\.css)["'][^>]*>/gi, (match, p1) => {
    const path = resolve(p1);
    const file = files.find(f => f.name === path);
    return file ? `<style>\n${file.content}\n</style>` : match;
  });

  // Inline JS <script src="...">
  html = html.replace(/<script\s+[^>]*src=["']([^"']*\.js)["'][^>]*><\/script>/gi, (match, p1) => {
    const path = resolve(p1);
    const file = files.find(f => f.name === path);
    return file ? `<script>\n${file.content}\n<\/script>` : match;
  });

  // Inject nav script inside <head> or at top
  html = html.includes('</head>')
    ? html.replace('</head>', navScript + '\n</head>')
    : navScript + html;

  return html;
}

// ─── Toolbar Button ─────────────────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, disabled, title, children, dark }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-sm
      ${disabled
        ? (dark ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')
        : (dark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-100' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800')
      }
    `}
  >
    {children}
  </button>
);

// ─── BrowserPreview ─────────────────────────────────────────────────────────────
const BrowserPreview = ({ files, theme, devServerPort, devServerStatus, language }) => {
  const [navHistory, setNavHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const iframeRef = useRef(null);

  const dark = theme === 'dark';
  const isWebContainer = ['react', 'nodejs', 'express', 'html'].includes(language);

  // Find the HTML entry page from files
  const entryPage = useMemo(() => {
    if (!files) return null;
    return (
      files.find(f => f.name === 'index.html')?.name ||
      files.find(f => f.name.endsWith('.html'))?.name ||
      null
    );
  }, [files?.map(f => f.name).join(',')]);  // eslint-disable-line

  // Initialise / reset history when entry page changes
  useEffect(() => {
    if (entryPage) {
      setNavHistory([entryPage]);
      setHistoryIdx(0);
    }
  }, [entryPage]);

  const currentPage = navHistory[historyIdx] || entryPage;

  // Navigate to a new page (adds to history, truncates forward stack)
  const navigateTo = useCallback((href) => {
    const resolved = resolveHref(currentPage, href);
    if (!resolved) return;
    const target = files?.find(f => f.name === resolved);
    if (!target) return;
    setNavHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1);
      return [...trimmed, target.name];
    });
    setHistoryIdx(prev => prev + 1);
  }, [currentPage, files, historyIdx]);

  // Listen for postMessage navigation events from iframe
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'ide-navigate') navigateTo(e.data.href);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigateTo]);

  // Rebuild srcDoc whenever files or current page changes
  const srcDoc = useMemo(
    () => buildSrcDoc(files, currentPage),
    [files, currentPage, refreshKey]  // eslint-disable-line
  );

  const canBack = historyIdx > 0;
  const canForward = historyIdx < navHistory.length - 1;

  // ── For Node.js project mode: show a live iframe or a loading skeleton ──
  if (isWebContainer) {
    let devUrl = null;
    if (devServerPort) {
      if (typeof devServerPort === 'string' && devServerPort.startsWith('http')) {
        devUrl = devServerPort;
      } else {
        // Always use 127.0.0.1 — avoids Windows IPv6 (::1) resolution issues with Node.js HTTP servers
        devUrl = `http://127.0.0.1:${devServerPort}`;
      }
    }

    const containerClasses = isMaximized
      ? `fixed inset-0 z-50 flex flex-col ${dark ? 'bg-[#0d1117]' : 'bg-white'}`
      : `w-full h-full flex flex-col ${dark ? 'bg-[#0d1117]' : 'bg-white'}`;

    return (
      <div className={containerClasses}>
        {/* Toolbar */}
        <div className={`flex items-center gap-1 px-2 py-1 border-b flex-shrink-0
          ${dark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'}
        `}>
          <div className="flex gap-1 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <ToolbarBtn dark={dark} title="Refresh" disabled={!devUrl}
            onClick={() => iframeRef.current && (iframeRef.current.src += '')}>↺</ToolbarBtn>
          <div className={`flex-1 mx-2 px-2 py-0.5 text-xs rounded truncate
            ${dark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500 border border-gray-300'}
          `}>
            {devUrl || (devServerStatus === 'installing' ? '📦 Installing dependencies...' : devServerStatus === 'starting' ? '⏳ Starting dev server...' : 'Not running — click Run ▶')}
          </div>
          <ToolbarBtn dark={dark} title={isMaximized ? "Restore view" : "Maximize preview"} onClick={() => setIsMaximized(!isMaximized)}>
            {isMaximized ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h8V4M4 8l5-5m11 13h-8v4m8-4l-5 5M8 16H4v4m4-4l-5 5m13-13h4v4m-4-4l5-5" />
              </svg>
            )}
          </ToolbarBtn>
          {devUrl && (
            <ToolbarBtn dark={dark} title="Open in new tab" onClick={() => {
              const newWindow = window.open('', '_blank');
              if (newWindow) {
                newWindow.document.write(`
                  <!DOCTYPE html>
                  <html style="margin:0;height:100%;overflow:hidden;">
                    <head><title>Preview Popout</title></head>
                    <body style="margin:0;height:100%;overflow:hidden;">
                      <iframe src="${devUrl}" style="width:100%;height:100%;border:none;"></iframe>
                      <script>
                        window.addEventListener('message', (e) => {
                          if (e.source === window.frames[0] && window.opener) {
                            window.opener.postMessage(e.data, '*', e.ports);
                          }
                        });
                      </script>
                    </body>
                  </html>
                `);
                newWindow.document.close();
              }
            }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </ToolbarBtn>
          )}
        </div>

        {/* Content area */}
        {devServerStatus === 'ready' && devUrl ? (
          <iframe
            key={devUrl}
            ref={iframeRef}
            src={devUrl}
            title="dev-server-preview"
            className="w-full flex-1 border-none bg-white"
          />
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center gap-4
            ${dark ? 'bg-[#0d1117] text-gray-500' : 'bg-gray-50 text-gray-400'}
          `}>
            {devServerStatus === 'idle' ? (
              <>
                <div className="text-5xl">⚡</div>
                <div className="text-center">
                  <p className="text-sm font-medium">Node.js Project Mode</p>
                  <p className="text-xs mt-1 opacity-70">Click <strong>▶ Run</strong> to install deps and start the dev server.</p>
                </div>
              </>
            ) : devServerStatus === 'error' ? (
              <>
                <div className="text-5xl">❌</div>
                <p className="text-sm font-medium text-red-400">Install failed — check the terminal for errors.</p>
              </>
            ) : (
              /* installing | starting — animated skeleton */
              <>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium animate-pulse">
                    {devServerStatus === 'installing' ? '📦 Installing dependencies...' : '🚀 Starting dev server...'}
                  </p>
                  <p className="text-xs mt-1 opacity-60">Watch the terminal for output</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const hasHtml = !!entryPage;
  const containerClasses = isMaximized
      ? `fixed inset-0 z-50 flex flex-col ${dark ? 'bg-[#0d1117]' : 'bg-white'}`
      : `w-full h-full flex flex-col ${dark ? 'bg-[#0d1117]' : 'bg-white'}`;

  return (
    <div className={containerClasses}>
      {/* ── Toolbar ── */}
      <div className={`flex items-center gap-1 px-2 py-1 border-b flex-shrink-0
        ${dark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-300'}
      `}>
        {/* Traffic lights */}
        <div className="flex gap-1 mr-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>

        <ToolbarBtn dark={dark} disabled={!canBack} title="Back"
          onClick={() => setHistoryIdx(i => i - 1)}>←</ToolbarBtn>
        <ToolbarBtn dark={dark} disabled={!canForward} title="Forward"
          onClick={() => setHistoryIdx(i => i + 1)}>→</ToolbarBtn>
        <ToolbarBtn dark={dark} title="Refresh"
          onClick={() => setRefreshKey(k => k + 1)}>↺</ToolbarBtn>

        {/* URL bar */}
        <div className={`flex-1 mx-2 px-2 py-0.5 text-xs rounded truncate
          ${dark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500 border border-gray-300'}
        `}>
          {currentPage ? `preview/${currentPage}` : 'No HTML file found'}
        </div>

        {/* Open in new tab (opens blob URL) */}
        {hasHtml && (
          <ToolbarBtn dark={dark} title="Open in new tab"
            onClick={() => {
              const blob = new Blob([srcDoc], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </ToolbarBtn>
        )}
      </div>

      {/* ── Preview / Placeholder ── */}
      {hasHtml ? (
        <iframe
          ref={iframeRef}
          key={`${currentPage}-${refreshKey}`}
          title="browser-preview"
          srcDoc={srcDoc}
          className="w-full flex-1 bg-white border-none"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
        />
      ) : (
        <div className={`flex-1 flex flex-col items-center justify-center gap-3
          ${dark ? 'text-gray-600 bg-[#0d1117]' : 'text-gray-400 bg-gray-50'}
        `}>
          <div className="text-5xl opacity-30">🌐</div>
          <div className="text-center">
            <p className="text-sm font-medium">No HTML file found</p>
            <p className="text-xs mt-1 opacity-70">
              Select the <strong>HTML</strong> language and create an <code>index.html</code> to see the preview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowserPreview;
