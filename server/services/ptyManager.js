'use strict';

/**
 * ptyManager.js — Session manager for Node.js project execution.
 *
 * On Windows, node-pty's ConPTY backend crashes in non-interactive processes.
 * We instead use child_process.spawn with cmd.exe (Windows) or bash (Linux/Mac)
 * which gives us reliable streaming I/O without native PTY issues.
 */

const { spawn } = require('child_process');
const path       = require('path');
const fs         = require('fs');
const os         = require('os');

// ── Constants ──────────────────────────────────────────────────────────────────
const IS_WINDOWS      = process.platform === 'win32';
const WORKSPACES_DIR  = path.join(__dirname, '..', 'workspaces');
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Ensure workspace root exists
if (!fs.existsSync(WORKSPACES_DIR)) {
    fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
}

// sessionId → SessionRecord
const sessions = new Map();

// ── Helpers ────────────────────────────────────────────────────────────────────
function workDir(sessionId) {
    return path.join(WORKSPACES_DIR, sessionId);
}

/** Minimal env that npm/node needs, without leaking host secrets */
function buildEnv() {
    const base = {
        FORCE_COLOR: '1',
        NODE_ENV:    'development',
        npm_config_loglevel: 'warn',
    };
    if (IS_WINDOWS) {
        return {
            ...base,
            PATH:         process.env.PATH         || '',
            APPDATA:      process.env.APPDATA      || '',
            LOCALAPPDATA: process.env.LOCALAPPDATA || '',
            SystemRoot:   process.env.SystemRoot   || 'C:\\Windows',
            USERPROFILE:  process.env.USERPROFILE  || '',
            TEMP:         process.env.TEMP         || os.tmpdir(),
            TMP:          process.env.TMP          || os.tmpdir(),
            ComSpec:      process.env.ComSpec      || 'C:\\Windows\\system32\\cmd.exe',
        };
    }
    return {
        ...base,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        HOME: process.env.HOME || os.homedir(),
    };
}

// ── Shell spawner ─────────────────────────────────────────────────────────────
function spawnShell(dir) {
    let proc;

    if (IS_WINDOWS) {
        proc = spawn('cmd.exe', ['/Q', '/K', 'echo.'], {
            cwd:         dir,
            env:         buildEnv(),
            stdio:       ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });
    } else {
        proc = spawn('bash', ['--login'], {
            cwd:      dir,
            env:      buildEnv(),
            stdio:    ['pipe', 'pipe', 'pipe'],
            detached: true,
        });
    }

    // Single mutable listener — replaced on each run so no stale closures
    let dataListener = null;
    let exitListener = null;

    proc.stdout.on('data', d => { if (dataListener) dataListener(d.toString()); });
    proc.stderr.on('data', d => { if (dataListener) dataListener(d.toString()); });
    proc.on('close', code => { if (exitListener) exitListener(code); });

    function kill() {
        try {
            if (IS_WINDOWS) {
                require('child_process').execSync(
                    `taskkill /pid ${proc.pid} /t /f`,
                    { stdio: 'ignore' }
                );
            } else {
                process.kill(-proc.pid, 'SIGKILL');
            }
        } catch (_) {}
    }

    return {
        process: proc,
        write(cmdLine) {
            if (proc.stdin.writable) {
                proc.stdin.write(cmdLine + (IS_WINDOWS ? '\r\n' : '\n'));
            }
        },
        // Replace (not append) the data handler for each run
        setDataHandler(fn) { dataListener = fn; },
        setExitHandler(fn) { exitListener = fn; },
        // Legacy push-style kept for backward compat but routes through setter
        onData(fn) { dataListener = fn; },
        onExit(fn) { exitListener = fn; },
        kill,
    };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Create a new session (kills any existing session for the same ID first).
 * Does NOT delete the workspace directory so re-runs can find node_modules.
 */
function createSession(sessionId) {
    // Kill old shell but KEEP the workspace directory (so node_modules survives)
    const existing = sessions.get(sessionId);
    if (existing) {
        clearTimeout(existing.idleTimer);
        existing.shell.kill();
        sessions.delete(sessionId);
        console.log(`[SESSION] Killed old shell: ${sessionId}`);
    }

    const dir = workDir(sessionId);
    fs.mkdirSync(dir, { recursive: true });

    const shell = spawnShell(dir);

    const record = {
        shell,
        workDir:       dir,
        devServerPort: null,
        phase:         'idle',
        idleTimer:     null,
    };

    sessions.set(sessionId, record);
    _resetIdle(sessionId);

    console.log(`[SESSION] Created: ${sessionId}  cwd=${dir}`);
    return record;
}

function getSession(sessionId) {
    return sessions.get(sessionId);
}

/**
 * Destroy a session and delete its workspace directory.
 * Called on socket disconnect — full cleanup.
 */
function destroySession(sessionId) {
    const rec = sessions.get(sessionId);
    if (!rec) return;

    clearTimeout(rec.idleTimer);
    rec.shell.kill();
    sessions.delete(sessionId);

    // Clean up workspace on disconnect
    const dir = workDir(sessionId);
    try {
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    } catch (_) {}

    console.log(`[SESSION] Destroyed: ${sessionId}`);
}

function writeFiles(sessionId, files) {
    const dir = workDir(sessionId);
    fs.mkdirSync(dir, { recursive: true });

    (files || []).forEach(f => {
        if (f.isFolder) return;
        const dest = path.join(dir, f.name);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, f.content || '', 'utf8');
    });
}

function resetIdle(sessionId) {
    _resetIdle(sessionId);
}

function _resetIdle(sessionId) {
    const rec = sessions.get(sessionId);
    if (!rec) return;
    clearTimeout(rec.idleTimer);
    rec.idleTimer = setTimeout(() => {
        console.log(`[SESSION] Idle timeout — destroying ${sessionId}`);
        destroySession(sessionId);
    }, IDLE_TIMEOUT_MS);
}

module.exports = {
    createSession,
    getSession,
    destroySession,
    writeFiles,
    resetIdle,
    workDir,
};
