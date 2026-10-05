import { webContainerService } from './WebContainerService';
import { templateService } from './TemplateService';

class ProjectManager {
  constructor() {
    this.currentProcess = null;
    this.onTerminalOutput = null;
    this.onStatusChange = null;
  }

  /**
   * Sets up the callbacks for UI updates
   */
  setCallbacks({ onTerminalOutput, onStatusChange }) {
    this.onTerminalOutput = onTerminalOutput;
    this.onStatusChange = onStatusChange;
  }

  /**
   * Writes to the terminal if the callback is set
   */
  writeTerminal(data) {
    if (this.onTerminalOutput) {
      this.onTerminalOutput(data);
    }
  }

  /**
   * Updates the project status if the callback is set
   */
  updateStatus(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  /**
   * Loads a template synchronously to display files instantly
   * @param {string} templateId 
   * @returns {Array} The flat files for the file explorer
   */
  loadTemplate(templateId) {
    const template = templateService.getTemplate(templateId);
    return templateService.toFlatFiles(template.files);
  }

  /**
   * Boots the WebContainer, mounts a specific tree, and starts the auto-install process
   * @param {object} files The FileSystemTree to mount
   */
  async bootCustomProject(files) {
    try {
      this.updateStatus('booting');
      this.writeTerminal(`\x1b[1;34mBooting WebContainer for GitHub Project...\x1b[0m\r\n`);
      
      await webContainerService.boot();
      
      this.writeTerminal(`\x1b[1;34mMounting files...\x1b[0m\r\n`);
      await webContainerService.mount(files);

      // Extract scripts to determine install/run commands
      const pkgJsonContent = files['package.json']?.file?.contents;
      let hasInstall = false;
      let devScript = null;
      
      if (pkgJsonContent) {
        try {
          const pkg = JSON.parse(pkgJsonContent);
          hasInstall = !!(pkg.dependencies || pkg.devDependencies);
          if (pkg.scripts && pkg.scripts.dev) {
            devScript = 'dev';
          } else if (pkg.scripts && pkg.scripts.start) {
            devScript = 'start';
          }
        } catch (e) {
          console.warn('Could not parse package.json', e);
        }
      }

      if (hasInstall) {
        await this.runInstall(devScript);
      } else if (devScript) {
        await this.runDev(devScript);
      } else {
        this.writeTerminal(`\r\n\x1b[32mProject ready. No start script found.\x1b[0m\r\n`);
        this.updateStatus('ready');
      }
    } catch (err) {
      this.writeTerminal(`\r\n\x1b[31m[ERROR] ${err.message}\x1b[0m\r\n`);
      this.updateStatus('error');
      throw err;
    }
  }

  /**
   * Boots the WebContainer, mounts files, and starts the auto-install process from a template
   * @param {string} templateId 
   */
  async bootProject(templateId) {
    const template = templateService.getTemplate(templateId);
    await this.bootCustomProject(template.files);
  }

  /**
   * Runs the installation process
   * @param {string|null} nextScript Script to run after install
   */
  async runInstall(nextScript = null) {
    this.updateStatus('installing');
    this.writeTerminal(`\x1b[1;32m> npm install\x1b[0m\r\n\r\n`);
    
    const installProcess = await webContainerService.spawn('npm', ['install']);
    this.currentProcess = installProcess;

    installProcess.output.pipeTo(new WritableStream({
      write: (data) => {
        this.writeTerminal(data);
      }
    }));

    const exitCode = await installProcess.exit;
    this.currentProcess = null;

    if (exitCode !== 0) {
      this.writeTerminal(`\r\n\x1b[31m[ERROR] Installation failed with code ${exitCode}\x1b[0m\r\n`);
      this.updateStatus('error');
      return;
    }

    this.writeTerminal(`\r\n\x1b[1;32m✔ Installation completed successfully\x1b[0m\r\n\r\n`);
    
    if (nextScript) {
      await this.runDev(nextScript);
    } else {
      this.updateStatus('ready');
    }
  }

  /**
   * Runs the dev server
   * @param {string} scriptName 
   */
  async runDev(scriptName) {
    this.updateStatus('starting');
    this.writeTerminal(`\x1b[1;32m> npm run ${scriptName}\x1b[0m\r\n\r\n`);
    
    const devProcess = await webContainerService.spawn('npm', ['run', scriptName]);
    this.currentProcess = devProcess;

    devProcess.output.pipeTo(new WritableStream({
      write: (data) => {
        this.writeTerminal(data);
      }
    }));

    // We don't await devProcess.exit here because it's a long-running dev server.
    // The server-ready event will handle the transition to 'ready' status.
  }

  /**
   * Write data to the current WebContainer process stdin
   */
  writeToProcess(data) {
    // If a process is running, we could pipe to its stdin.
    // However, @webcontainer/api provides a WritableStream on `process.input`.
    if (this.currentProcess) {
      const writer = this.currentProcess.input.getWriter();
      writer.write(data);
      writer.releaseLock();
    }
  }
}

export const projectManager = new ProjectManager();
