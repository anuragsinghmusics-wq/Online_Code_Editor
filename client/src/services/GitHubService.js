class GitHubService {
  /**
   * Parses a GitHub URL into owner and repo name.
   * @param {string} url e.g., https://github.com/facebook/react
   * @returns {{ owner: string, repo: string } | null}
   */
  parseUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== 'github.com') return null;
      
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches a repository and converts it to a WebContainer FileSystemTree.
   * @param {string} url GitHub repository URL
   * @param {Function} onProgress Callback to update UI with progress
   * @returns {Promise<{ tree: object, flatFiles: Array }>}
   */
  async fetchRepo(url, onProgress = () => {}) {
    const parsed = this.parseUrl(url);
    if (!parsed) {
      throw new Error('Invalid GitHub URL');
    }
    const { owner, repo } = parsed;

    onProgress(`Fetching repository info for ${owner}/${repo}...`);

    // 1. Get default branch
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoInfoRes.ok) {
      if (repoInfoRes.status === 403) throw new Error('GitHub API rate limit exceeded.');
      if (repoInfoRes.status === 404) throw new Error('Repository not found or is private.');
      throw new Error(`Failed to fetch repo info: ${repoInfoRes.statusText}`);
    }
    const repoInfo = await repoInfoRes.json();
    const branch = repoInfo.default_branch;

    onProgress(`Fetching file tree for branch: ${branch}...`);

    // 2. Get tree recursively
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (!treeRes.ok) {
      throw new Error('Failed to fetch repository tree.');
    }
    const treeData = await treeRes.json();

    if (treeData.truncated) {
      console.warn('Repository is too large, tree was truncated.');
    }

    // Filter to only files (blobs), ignore trees (directories)
    const files = treeData.tree.filter(item => item.type === 'blob');
    
    // Filter out huge files or unneeded binaries (optional but good for WebContainers)
    const validFiles = files.filter(f => 
      !f.path.includes('.git/') && 
      !f.path.includes('node_modules/') && 
      f.size < 5000000 // skip files > 5MB
    );

    const flatFiles = [];
    const fsTree = {};

    onProgress(`Downloading ${validFiles.length} files...`);

    // 3. Fetch raw content in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
      const batch = validFiles.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (file) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
          const res = await fetch(rawUrl);
          if (!res.ok) throw new Error('Failed');
          const content = await res.text();
          
          flatFiles.push({
            name: file.path,
            content: content
          });

          // Build WebContainer tree structure
          const parts = file.path.split('/');
          let current = fsTree;
          
          for (let j = 0; j < parts.length; j++) {
            const part = parts[j];
            if (j === parts.length - 1) {
              current[part] = { file: { contents: content } };
            } else {
              if (!current[part]) {
                current[part] = { directory: {} };
              }
              current = current[part].directory;
            }
          }
        } catch (err) {
          console.warn(`Failed to download ${file.path}`, err);
        }
      }));

      onProgress(`Downloaded ${Math.min(i + BATCH_SIZE, validFiles.length)} of ${validFiles.length} files...`);
    }

    onProgress('Download complete.');
    return { tree: fsTree, flatFiles };
  }

  /**
   * Creates a repository on GitHub and pushes a flat list of files.
   * @param {string} token GitHub Personal Access Token
   * @param {string} repoName Name of the new repository
   * @param {boolean} isPrivate Whether the repo should be private
   * @param {Array<{name: string, content: string}>} files Array of flat files
   * @param {Function} onProgress Callback to report progress
   * @returns {Promise<{ html_url: string }>}
   */
  async createRepoAndPush(token, repoName, isPrivate, files, onProgress = () => {}) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };

    try {
      // 1. Get authenticated user
      onProgress('Authenticating with GitHub...');
      const userRes = await fetch('https://api.github.com/user', { headers });
      if (!userRes.ok) throw new Error('Authentication failed. Check your token.');
      const user = await userRes.json();
      const owner = user.login;

      // 2. Create the repository
      onProgress(`Creating repository ${repoName}...`);
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: repoName,
          private: isPrivate,
          auto_init: true // Creates an initial commit so the main branch exists
        })
      });
      
      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.message || 'Failed to create repository.');
      }
      const repoData = await createRes.json();
      const branch = repoData.default_branch || 'main';

      // 3. Create Blobs for all files
      onProgress('Uploading files (creating blobs)...');
      const treeNodes = [];
      for (const file of files) {
        if (!file.content && file.content !== '') continue; // Skip folders or empty content types if any

        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8'
          })
        });
        
        if (!blobRes.ok) throw new Error(`Failed to upload ${file.name}`);
        const blobData = await blobRes.json();
        
        treeNodes.push({
          path: file.name,
          mode: '100644', // File mode
          type: 'blob',
          sha: blobData.sha
        });
      }

      // 4. Get the current branch reference SHA
      onProgress('Preparing commit tree...');
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/${branch}`, { headers });
      if (!refRes.ok) throw new Error('Failed to fetch base reference.');
      const refData = await refRes.json();
      const baseTreeSha = refData.object.sha;

      // 5. Create a new Tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeNodes
        })
      });
      if (!treeRes.ok) throw new Error('Failed to create git tree.');
      const treeData = await treeRes.json();

      // 6. Create a Commit
      onProgress('Creating commit...');
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: 'Initial commit from Online Code Editor',
          tree: treeData.sha,
          parents: [baseTreeSha]
        })
      });
      if (!commitRes.ok) throw new Error('Failed to create commit.');
      const commitData = await commitRes.json();

      // 7. Update the Branch Reference
      onProgress('Pushing commit to branch...');
      const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: commitData.sha
        })
      });
      if (!updateRefRes.ok) throw new Error('Failed to update branch reference.');

      onProgress('Repository created successfully!');
      return { html_url: repoData.html_url };
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

export const githubService = new GitHubService();
