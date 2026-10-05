import { templates } from './templates';

class TemplateService {
  /**
   * Retrieves a template by its ID
   * @param {string} templateId 
   * @returns {object} The template object containing files and metadata
   */
  getTemplate(templateId) {
    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template;
  }

  /**
   * Gets a list of all available templates
   * @returns {Array} List of template metadata
   */
  getAvailableTemplates() {
    return Object.values(templates).map(t => ({
      id: t.id,
      name: t.name,
      language: t.language
    }));
  }

  /**
   * Converts the internal FileSystemTree to a flat array of files for the UI FileExplorer
   * @param {object} tree 
   * @param {string} currentPath 
   * @returns {Array} Array of file objects { name, content }
   */
  toFlatFiles(tree, currentPath = '') {
    let files = [];
    for (const [name, node] of Object.entries(tree)) {
      const fullPath = currentPath ? `${currentPath}/${name}` : name;
      if (node.file) {
        files.push({
          name: fullPath,
          content: node.file.contents
        });
      } else if (node.directory) {
        files = files.concat(this.toFlatFiles(node.directory, fullPath));
      }
    }
    return files;
  }

  /**
   * Converts a flat array of files { name, content } to a WebContainer FileSystemTree
   * @param {Array} flatFiles 
   * @returns {object} FileSystemTree
   */
  toFileSystemTree(flatFiles) {
    const tree = {};
    
    for (const file of flatFiles) {
      const parts = file.name.split('/');
      let currentLevel = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // If it's the last part, it's a file
        if (i === parts.length - 1) {
          currentLevel[part] = {
            file: {
              contents: file.content || ''
            }
          };
        } else {
          // It's a directory
          if (!currentLevel[part]) {
            currentLevel[part] = {
              directory: {}
            };
          }
          currentLevel = currentLevel[part].directory;
        }
      }
    }
    
    return tree;
  }
}

export const templateService = new TemplateService();
