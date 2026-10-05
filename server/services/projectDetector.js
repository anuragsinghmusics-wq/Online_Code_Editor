'use strict';

/**
 * Detect the project type from an in-memory array of IDE files.
 *
 * @param {Array<{name: string, content: string, isFolder?: boolean}>} files
 * @returns {{ type: string, scripts: object, dependencies: object } | null}
 */
function detectProject(files) {
    // Look for root-level package.json first, then any nested one
    const pkgFile =
        files.find(f => f.name === 'package.json') ||
        files.find(f => !f.isFolder && f.name.endsWith('package.json'));

    if (pkgFile) {
        let pkg = {};
        try { pkg = JSON.parse(pkgFile.content || '{}'); } catch (_) { /* ignore */ }
        return {
            type: 'nodejs',
            packageName: pkg.name || 'project',
            scripts: pkg.scripts || {},
            dependencies: { ...pkg.dependencies, ...pkg.devDependencies },
        };
    }

    if (files.some(f => f.name === 'requirements.txt')) return { type: 'python' };
    if (files.some(f => f.name === 'pom.xml'))          return { type: 'java-maven' };

    return null;
}

/**
 * Pick the best npm script to run as the dev server.
 * Priority: dev > start > serve > preview
 *
 * @param {object} scripts  package.json scripts object
 * @returns {string|null}   script name, or null if none found
 */
function pickDevScript(scripts) {
    const priority = ['dev', 'start', 'serve', 'preview'];
    for (const name of priority) {
        if (scripts && scripts[name]) return name;
    }
    return null;
}

module.exports = { detectProject, pickDevScript };
