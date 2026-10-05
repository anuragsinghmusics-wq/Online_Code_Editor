const express = require('express');
const axios = require('axios');
const router = express.Router();

// Language name and version mapping for Piston API
const PISTON_LANG_MAP = {
    'javascript': { language: 'javascript', version: '20.11.1' },
    'python': { language: 'python', version: '3.12.0' },
    'java': { language: 'java', version: '15.0.2' },
    'c++': { language: 'c++', version: '10.2.0' },
    'typescript': { language: 'typescript', version: '*' },
    'php': { language: 'php', version: '*' },
    'ruby': { language: 'ruby', version: '*' },
    'perl': { language: 'perl', version: '*' },
    'bash': { language: 'bash', version: '*' },
    'sqlite3': { language: 'sqlite3', version: '*' },
    'rust': { language: 'rust', version: '*' },
    'go': { language: 'go', version: '*' },
    'c': { language: 'c', version: '*' },
    'csharp': { language: 'csharp', version: '*' },
    'kotlin': { language: 'kotlin', version: '*' }
};

// Try local Piston first, then fall back to the public emkc.org API
const PISTON_LOCAL = 'http://127.0.0.1:2000/api/v2/execute';
const PISTON_PUBLIC = 'https://emkc.org/api/v2/piston/execute';

async function runOnPiston(url, language, version, code, stdin = "") {
    const response = await axios.post(url, {
        language,
        version: version || '*',
        files: [{ content: code }],
        stdin: stdin
    }, { timeout: 30000 });
    return response.data;
}

router.post('/', async (req, res) => {
    const { language, code, stdin } = req.body;

    if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required.' });
    }

    const pistonConfig = PISTON_LANG_MAP[language];
    if (!pistonConfig) {
        return res.status(400).json({ error: `Language '${language}' is not supported.` });
    }

    const { language: pistonLang, version } = pistonConfig;
    let data;

    try {
        console.log(`[LOCAL] Trying ${pistonLang} on local Piston...`);
        data = await runOnPiston(PISTON_LOCAL, pistonLang, version, code, stdin);
        console.log(`[LOCAL] Success:`, data?.run?.stdout || data?.run?.stderr);
    } catch (localErr) {
        console.warn(`[LOCAL] Failed: ${localErr.message}. Falling back to public Piston API...`);
        // Fall back to public Piston API
        try {
            console.log(`[PUBLIC] Trying ${language} on emkc.org Piston...`);
            data = await runOnPiston(PISTON_PUBLIC, pistonLang, version, code, stdin);
            console.log(`[PUBLIC] Success:`, data?.run?.stdout || data?.run?.stderr);
        } catch (publicErr) {
            console.error(`[PUBLIC] Failed:`, publicErr?.response?.data || publicErr.message);
            return res.status(500).json({ error: 'Failed to execute code on all available engines.' });
        }
    }

    // Check if the execution actually timed out or crashed (run succeeded, but status is bad)
    const runData = data.run || {};
    const compileData = data.compile || {};

    const stdout = runData.stdout || '';
    const stderr = runData.stderr || '';
    const compileErrors = compileData.stderr || '';
    const exitCode = runData.code;

    // If run was killed by SIGKILL (timeout), fall back to public Piston
    if (runData.signal === 'SIGKILL' || runData.status === 'TO') {
        console.warn(`[LOCAL] Run timed out. Falling back to public Piston API...`);
        try {
            const fallbackData = await runOnPiston(PISTON_PUBLIC, pistonLang, version, code, stdin);
            const fbRun = fallbackData.run || {};
            const fbCompile = fallbackData.compile || {};
            const fbStdout = fbRun.stdout || '';
            const fbStderr = fbRun.stderr || '';
            const fbCompErr = fbCompile.stderr || '';
            const fbExit = fbRun.code;
            const fbSuccess = fbExit === 0 && !fbCompErr && !fbStderr;
            return res.json({
                stdout: fbStdout,
                stderr: fbStderr,
                compileErrors: fbCompErr,
                status: fbSuccess ? 'Success' : 'Error'
            });
        } catch (fbErr) {
            console.error(`[PUBLIC] Fallback failed:`, fbErr?.response?.data || fbErr.message);
            return res.status(500).json({ error: 'Code execution timed out and fallback failed.' });
        }
    }

    const isSuccess = exitCode === 0 && !compileErrors && !stderr;

    res.json({
        stdout,
        stderr,
        compileErrors,
        status: isSuccess ? 'Success' : 'Error'
    });
});

module.exports = router;
