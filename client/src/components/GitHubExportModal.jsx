import React, { useState } from 'react';
import { githubService } from '../services/GitHubService';

const GitHubExportModal = ({ isOpen, onClose, files, theme }) => {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  if (!isOpen) return null;

  const dark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !repoName) return;

    setStatus('loading');
    setErrorMsg('');
    setProgressMsg('Starting export...');

    try {
      const result = await githubService.createRepoAndPush(
        token, 
        repoName, 
        isPrivate, 
        files, 
        (msg) => setProgressMsg(msg)
      );
      setRepoUrl(result.html_url);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const resetAndClose = () => {
    setStatus('idle');
    setProgressMsg('');
    setErrorMsg('');
    setRepoUrl('');
    setRepoName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${dark ? 'bg-[#1e1e1e] border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${dark ? 'border-gray-700 bg-[#252526]' : 'border-gray-200 bg-gray-50'}`}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Create Repository
          </h2>
          <button onClick={resetAndClose} className={`p-1 rounded-md hover:bg-black/10 ${dark ? 'hover:bg-white/10' : ''}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Export Successful!</h3>
              <p className={`mb-6 text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Your project has been successfully pushed to GitHub.</p>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" 
                className="inline-block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Open in GitHub
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxx"
                  disabled={status === 'loading'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow
                    ${dark ? 'bg-[#2d2d2d] border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <p className={`text-xs mt-1.5 ${dark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Requires the <strong>repo</strong> scope. Tokens are only used locally and never stored on a server.
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Repository Name
                </label>
                <input
                  type="text"
                  required
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-project"
                  disabled={status === 'loading'}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow
                    ${dark ? 'bg-[#2d2d2d] border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="private-repo"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={status === 'loading'}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="private-repo" className={`text-sm cursor-pointer select-none ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Make repository private
                </label>
              </div>

              {status === 'loading' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-50 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-blue-700">{progressMsg}</span>
                </div>
              )}

              {status === 'error' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                  <span className="font-semibold block mb-1">Export Failed</span>
                  {errorMsg}
                </div>
              )}

              <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? 'Exporting...' : 'Create Repository'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubExportModal;
