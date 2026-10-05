import { WebContainer } from '@webcontainer/api';

class WebContainerService {
  constructor() {
    this.instance = null;
    this.bootPromise = null;
    this.currentProcess = null;
    this.onServerReady = null;
  }

  /**
   * Boots the WebContainer instance if it hasn't been booted yet.
   * Ensures only one boot happens concurrently.
   * @returns {Promise<WebContainer>}
   */
  async boot() {
    if (this.instance) {
      return this.instance;
    }

    if (this.bootPromise) {
      return this.bootPromise;
    }

    console.log('Checking SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');
    if (typeof SharedArrayBuffer === 'undefined') {
      const msg = 'SharedArrayBuffer is not defined. COOP/COEP headers might be missing.';
      console.error(msg);
      throw new Error(msg);
    }
    
    console.log('Booting WebContainer...');
    this.bootPromise = WebContainer.boot().then(instance => {
      this.instance = instance;
      
      // Listen for server-ready events globally on the instance
      this.instance.on('server-ready', (port, url) => {
        console.log(`WebContainer server ready on port ${port}, url: ${url}`);
        if (this.onServerReady) {
          this.onServerReady(port, url);
        }
      });
      
      return instance;
    }).catch(err => {
      this.bootPromise = null;
      console.error('Failed to boot WebContainer:', err);
      throw err;
    });

    return this.bootPromise;
  }

  /**
   * Mounts a FileSystemTree to the WebContainer
   * @param {object} tree 
   */
  async mount(tree) {
    const instance = await this.boot();
    await instance.mount(tree);
  }

  /**
   * Spawns a command in the WebContainer
   * @param {string} cmd 
   * @param {Array<string>} args 
   * @param {object} options 
   * @returns {Promise<WebContainerProcess>}
   */
  async spawn(cmd, args = [], options = {}) {
    const instance = await this.boot();
    
    // Optionally kill any currently running process if it's meant to be replaced
    // This is handled at the ProjectManager level usually, but we could enforce it here.
    
    const process = await instance.spawn(cmd, args, options);
    return process;
  }

  /**
   * Sets the callback for the server-ready event
   * @param {Function} cb 
   */
  setServerReadyHandler(cb) {
    this.onServerReady = cb;
  }
}

export const webContainerService = new WebContainerService();
