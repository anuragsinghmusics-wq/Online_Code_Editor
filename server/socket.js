'use strict';

const { spawn, exec } = require('child_process');
const fs   = require('fs');
const path = require('path');

const { createSession, getSession, destroySession, writeFiles, resetIdle } = require('./services/ptyManager');
const { detectProject, pickDevScript } = require('./services/projectDetector');

const IS_WINDOWS = process.platform === 'win32';

// ── Piston language map (unchanged) ───────────────────────────────────────────
const PISTON_LANG_MAP = {
    'javascript': { folder: 'node',       version: '20.11.1', file: 'index.js'    },
    'python':     { folder: 'python',     version: '3.12.0',  file: 'script.py'   },
    'java':       { folder: 'java',       version: '15.0.2',  file: 'Main.java'   },
    'c++':        { folder: 'gcc',        version: '10.2.0',  file: 'main.cpp'    },
    'typescript': { folder: 'typescript', version: '5.0.3',   file: 'index.ts'    },
    'php':        { folder: 'php',        version: '8.2.3',   file: 'index.php'   },
    'ruby':       { folder: 'ruby',       version: '3.2.1',   file: 'index.rb'    },
    'perl':       { folder: 'perl',       version: '5.36.0',  file: 'index.pl'    },
    'bash':       { folder: 'bash',       version: '5.2.0',   file: 'index.sh'    },
    'sqlite3':    { folder: 'sqlite3',    version: '3.41.2',  file: 'index.sql'   },
    'rust':       { folder: 'rust',       version: '1.68.2',  file: 'main.rs'     },
    'go':         { folder: 'go',         version: '1.20.3',  file: 'main.go'     },
    'c':          { folder: 'gcc',        version: '10.2.0',  file: 'main.c'      },
    'csharp':     { folder: 'dotnet',     version: '5.0.201', file: 'Program.cs'  },
    'kotlin':     { folder: 'kotlin',     version: '1.8.20',  file: 'Main.kt'     },
};

// Port-detection regexes (Steps 5)
const PORT_PATTERNS = [
    /Local:\s+https?:\/\/[^:]+:(\d{4,5})/i,   // Vite "Local: http://localhost:5173"
    /localhost:(\d{4,5})/i,                     // Generic
    /127\.0\.0\.1:(\d{4,5})/i,                 // Generic IP
    /on port\s+(\d{4,5})/i,                    // CRA / various
    /listening.*?:(\d{4,5})/i,                 // Express / Node http
    /:(\d{4,5})\//,                             // Catch-all :PORT/
];

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// ── Install sentinel strings ───────────────────────────────────────────────────
const INSTALL_SENTINEL = '__INSTALL_DONE__';
const SERVER_EXIT_SENTINEL = '__SERVER_EXIT__';

// ══════════════════════════════════════════════════════════════════════════════
function initSocket(io) {
    io.on('connection', (socket) => {
        console.log(`[SOCKET] Connected: ${socket.id}`);

        // Per-socket state for the legacy Piston path
        let activeProcess   = null;
        let runFolderId     = `run_${socket.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        let containerRunPath = `/piston/runs/${runFolderId}`;

        // Whether this socket is using the PTY path (nodejs) or Piston
        let usingPty = false;

        // ── RUN event ────────────────────────────────────────────────────────
        socket.on('run', async ({ language, files }) => {
            console.log(`[SOCKET] Run: ${language}`);

            // ── HTML: browser preview only ──
            if (language === 'html') {
                socket.emit('output', { data: '\r\n[INFO] HTML/CSS/JS renders in the Browser Preview tab.\r\n', type: 'stdout' });
                socket.emit('exit', { code: 0 });
                return;
            }

            // ── Node.js PROJECT: PTY path ──────────────────────────────────
            if (language === 'nodejs') {
                usingPty = true;
                _handleNodeProject(socket, files);
                return;
            }

            // ── All other languages: Piston/Docker path (unchanged) ─────────
            usingPty = false;
            _handlePiston(socket, language, files, {
                activeProcess,
                runFolderId,
                containerRunPath,
                setActiveProcess: (p) => { activeProcess = p; },
            });
        });

        // ── TERMINAL INPUT ────────────────────────────────────────────────────
        socket.on('input', ({ data }) => {
            if (usingPty) {
                const rec = getSession(socket.id);
                if (rec) {
                    resetIdle(socket.id);
                    rec.shell.write(data);
                }
            } else {
                if (activeProcess && activeProcess.stdin.writable) {
                    activeProcess.stdin.write(data);
                }
            }
        });

        // ── TERMINAL RESIZE ───────────────────────────────────────────────────
        socket.on('terminal-resize', ({ cols, rows }) => {
            // child_process shell doesn't have PTY resize — ignore gracefully
        });

        socket.on('stop', () => {
            if (usingPty) {
                const rec = getSession(socket.id);
                if (rec) {
                    // Kill the entire process tree — Ctrl+C is not reliable on Windows CMD
                    // The session record stays in the map; next run calls createSession
                    // which will kill this dead shell and spawn a fresh one
                    rec.shell.kill();
                    rec.phase = 'idle';
                    rec.devServerPort = null;
                    socket.emit('output', { data: '\r\n\x1b[33m[Stopped]\x1b[0m\r\n', type: 'stdout' });
                    socket.emit('exit', { code: 130 });
                }
            } else {
                if (activeProcess) {
                    activeProcess.kill();
                    activeProcess = null;
                    socket.emit('output', { data: '\r\n[PROCESS KILLED] Stopped by user.\r\n', type: 'stdout' });
                    socket.emit('exit', { code: 130 });
                    exec(`docker exec piston_api rm -rf ${containerRunPath}`);
                    _cleanLocalFolder(runFolderId);
                }
            }
        });

        // ── DISCONNECT ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`[SOCKET] Disconnected: ${socket.id}`);
            if (usingPty) {
                destroySession(socket.id);
            } else {
                if (activeProcess) activeProcess.kill();
                exec(`docker exec piston_api rm -rf ${containerRunPath}`);
                _cleanLocalFolder(runFolderId);
            }
        });
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  PTY / Node.js project handler  (Steps 1–5)
// ══════════════════════════════════════════════════════════════════════════════
function _handleNodeProject(socket, files) {
    const sessionId = socket.id;

    // Detect project from in-memory files
    const projectInfo = detectProject(files);
    if (!projectInfo || projectInfo.type !== 'nodejs') {
        socket.emit('output', {
            data: '\r\n\x1b[31m[ERROR] No package.json found. Please add one to use Node.js project mode.\x1b[0m\r\n',
            type: 'stderr'
        });
        socket.emit('exit', { code: 1 });
        return;
    }

    // Write IDE files to disk so npm can work with them
    writeFiles(sessionId, files);

    // Create PTY session (kills old shell if one exists, keeps workspace)
    const rec = createSession(sessionId);
    rec.phase = 'installing';

    // Buffer for sentinel detection (accumulates across data chunks)
    let sentinelBuffer = '';

    // ── Wire shell output → client terminal ──
    // Use setDataHandler (replaces, not appends) to avoid stale listeners on re-run
    rec.shell.setDataHandler(data => {
        // Forward all output to xterm terminal
        socket.emit('output', { data, type: 'stdout' });

        sentinelBuffer += data;

        // ── Port detection (Step 5) ── check full buffer too
        if (rec.phase === 'running' && !rec.devServerPort) {
            for (const pattern of PORT_PATTERNS) {
                const m = sentinelBuffer.match(pattern);
                if (m) {
                    const port = parseInt(m[1], 10);
                    if (port > 1000 && port < 65535) {
                        rec.devServerPort = port;
                        console.log(`[SESSION] Server ready on port ${port}`);
                        socket.emit('server-ready', { port });
                        // Clear buffer after detection to avoid false re-fires
                        sentinelBuffer = '';
                        break;
                    }
                }
            }
        }

        // ── Install sentinel (Step 3) ──
        if (rec.phase === 'installing' && sentinelBuffer.includes(INSTALL_SENTINEL)) {
            const match = sentinelBuffer.match(/__INSTALL_DONE__(\d+)/);
            if (match) {
                const code = parseInt(match[1], 10);
                sentinelBuffer = '';  // reset
                if (code === 0) {
                    socket.emit('install-complete');
                    _startDevServer(socket, rec, projectInfo, sessionId);
                } else {
                    rec.phase = 'idle';
                    socket.emit('install-error', { code });
                    socket.emit('output', {
                        data: `\r\n\x1b[31m[ERROR] npm install failed (exit ${code})\x1b[0m\r\n`,
                        type: 'stderr'
                    });
                    socket.emit('exit', { code });
                }
            }
        }
    });

    rec.shell.setExitHandler(code => {
        if (rec.phase !== 'idle') {
            socket.emit('exit', { code: code || 0 });
            rec.phase = 'idle';
        }
    });

    // ── Run npm install with sentinel (Step 3) ──
    socket.emit('output', {
        data: '\r\n\x1b[1;34m\u{1F4E6} Installing dependencies...\x1b[0m\r\n',
        type: 'stdout'
    });

    // cmd.exe uses & and %ERRORLEVEL%, bash uses ; and $?
    // We MUST use "call" on Windows because npm is a .cmd file, which terminates the shell if not called.
    const installCmd = IS_WINDOWS
        ? `call npm install & echo ${INSTALL_SENTINEL}%ERRORLEVEL%`
        : `npm install; echo ${INSTALL_SENTINEL}$?`;

    rec.shell.write(installCmd);
}

// ── Start the dev server after a successful install ────────────────────────
function _startDevServer(socket, rec, projectInfo, sessionId) {
    const script = pickDevScript(projectInfo.scripts);

    if (!script) {
        socket.emit('output', {
            data: '\r\n\x1b[33m⚠️  No dev/start/serve script found in package.json.\x1b[0m\r\n',
            type: 'stderr'
        });
        socket.emit('exit', { code: 1 });
        rec.phase = 'idle';
        return;
    }

    rec.phase = 'running';

    socket.emit('dev-server-starting', { script });
    socket.emit('output', {
        data: `\r\n\x1b[1;32m🚀 Starting dev server: npm run ${script}...\x1b[0m\r\n`,
        type: 'stdout'
    });

    const runCmd = IS_WINDOWS
        ? `call npm run ${script}`
        : `npm run ${script}`;

    rec.shell.write(runCmd);
}

// ══════════════════════════════════════════════════════════════════════════════
//  Piston/Docker handler (completely unchanged from original)
// ══════════════════════════════════════════════════════════════════════════════
function _handlePiston(socket, language, files, ctx) {
    const { runFolderId, containerRunPath, setActiveProcess } = ctx;

    if (ctx.activeProcess) {
        ctx.activeProcess.kill();
        setActiveProcess(null);
    }

    const langConfig = PISTON_LANG_MAP[language];
    if (!langConfig) {
        socket.emit('output', { data: `\r\n[ERROR] Language '${language}' is not supported.\r\n`, type: 'stderr' });
        socket.emit('exit', { code: 1 });
        return;
    }

    const { folder, version, file: mainFilename } = langConfig;
    const packagePath = `/piston/packages/${folder}/${version}`;

    const localFolder = path.join(tempDir, runFolderId);
    if (!fs.existsSync(localFolder)) fs.mkdirSync(localFolder);

    let fileList = files;
    if (!fileList && arguments[0] && arguments[0].code) {
        fileList = [{ name: mainFilename, content: arguments[0].code }];
    }

    fileList.forEach(f => {
        const safePath = path.join(localFolder, f.name);
        fs.mkdirSync(path.dirname(safePath), { recursive: true });
        fs.writeFileSync(safePath, f.content || '');
    });

    socket.emit('output', { data: 'Compiling and starting environment...\r\n', type: 'stdout' });

    exec(`docker exec piston_api mkdir -p ${containerRunPath}`, (err) => {
        if (err) {
            socket.emit('output', { data: `\r\n[ERROR] Failed to set up container workspace: ${err.message}\r\n`, type: 'stderr' });
            socket.emit('exit', { code: 1 });
            return;
        }

        exec(`docker cp "${localFolder}/." "piston_api:${containerRunPath}/"`, (copyErr) => {
            if (copyErr) {
                socket.emit('output', { data: `\r\n[ERROR] Failed to copy code: ${copyErr.message}\r\n`, type: 'stderr' });
                socket.emit('exit', { code: 1 });
                return;
            }

            exec(`docker exec piston_api [ -f ${packagePath}/compile ]`, (compileCheckErr) => {
                if (!compileCheckErr) {
                    socket.emit('output', { data: 'Compiling code...\r\n', type: 'stdout' });
                    const compileCmd = `docker exec piston_api sh -c "cd ${packagePath} && . ./environment && cd ${containerRunPath} && PISTON_LANGUAGE=${language} bash ${packagePath}/compile ${mainFilename}"`;
                    exec(compileCmd, (compileErr, _stdout, stderr) => {
                        if (stderr) socket.emit('output', { data: stderr, type: 'stderr' });
                        if (compileErr) {
                            socket.emit('output', { data: '\r\n[COMPILE ERROR]\r\n', type: 'stderr' });
                            socket.emit('exit', { code: compileErr.code || 1 });
                            _pistonCleanup(containerRunPath, localFolder);
                            return;
                        }
                        _pistonRun(socket, containerRunPath, packagePath, mainFilename, language, localFolder, setActiveProcess);
                    });
                } else {
                    _pistonRun(socket, containerRunPath, packagePath, mainFilename, language, localFolder, setActiveProcess);
                }
            });
        });
    });
}

function _pistonRun(socket, containerRunPath, packagePath, mainFilename, language, localFolder, setActiveProcess) {
    const runCmd = `cd ${packagePath} && . ./environment && cd ${containerRunPath} && bash ${packagePath}/run ${mainFilename}`;
    const proc = spawn('docker', ['exec', '-i', 'piston_api', 'sh', '-c', runCmd]);
    setActiveProcess(proc);

    proc.stdout.on('data', d => socket.emit('output', { data: d.toString(), type: 'stdout' }));
    proc.stderr.on('data', d => socket.emit('output', { data: d.toString(), type: 'stderr' }));
    proc.on('close', code => {
        socket.emit('exit', { code });
        setActiveProcess(null);
        _pistonCleanup(containerRunPath, localFolder);
    });
    proc.on('error', err => {
        socket.emit('output', { data: `\r\n[ERROR] ${err.message}\r\n`, type: 'stderr' });
        socket.emit('exit', { code: 1 });
        setActiveProcess(null);
        _pistonCleanup(containerRunPath, localFolder);
    });
}

function _pistonCleanup(containerRunPath, localFolder) {
    exec(`docker exec piston_api rm -rf ${containerRunPath}`);
    try {
        if (fs.existsSync(localFolder)) fs.rmSync(localFolder, { recursive: true, force: true });
    } catch (_) {}
}

function _cleanLocalFolder(runFolderId) {
    try {
        const localFolder = path.join(tempDir, runFolderId);
        if (fs.existsSync(localFolder)) fs.rmSync(localFolder, { recursive: true, force: true });
    } catch (_) {}
}

module.exports = { initSocket };
