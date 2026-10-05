// List of common text extensions
export const textExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'json', 'md', 'txt', 'svg', 'xml'];

// Helper to read a file as text or ArrayBuffer based on extension
export const readFile = (file, isText) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (isText) resolve(reader.result);
      else resolve(new Uint8Array(reader.result));
    };
    reader.onerror = reject;
    if (isText) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
};

/**
 * Process a FileList from an <input type="file"> and return an array of files.
 * @param {FileList} fileList 
 * @returns {Promise<Array<{name: string, content: Uint8Array | string, isFolder: boolean}>>}
 */
export async function processFileInput(fileList) {
  const files = [];
  const createdFolders = new Set();

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const fullPath = file.webkitRelativePath || file.name;
    
    const parts = fullPath.split('/');
    if (parts.length > 1) {
      let currentPath = '';
      for (let j = 0; j < parts.length - 1; j++) {
        currentPath = currentPath ? `${currentPath}/${parts[j]}` : parts[j];
        if (!createdFolders.has(currentPath)) {
          createdFolders.add(currentPath);
          files.push({ name: currentPath, isFolder: true });
        }
      }
    }

    const ext = fullPath.split('.').pop()?.toLowerCase();
    const isText = textExtensions.includes(ext);
    const content = await readFile(file, isText);
    
    files.push({
      name: fullPath,
      content: content,
      isFolder: false,
    });
  }

  return files;
}

/**
 * Process a DataTransferItemList and return an array of files.
 * @param {DataTransferItemList} items 
 * @returns {Promise<Array<{name: string, content: Uint8Array | string, isFolder: boolean}>>}
 */
export async function processDroppedItems(items) {
  const files = [];

  const traverseEntry = async (entry, path = '') => {
    const fullPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      });
      const ext = entry.name.split('.').pop()?.toLowerCase();
      const isText = textExtensions.includes(ext);
      
      const content = await readFile(file, isText);
      files.push({
        name: fullPath,
        content: content,
        isFolder: false,
      });
    } else if (entry.isDirectory) {
      files.push({
        name: fullPath,
        isFolder: true,
      });
      
      const dirReader = entry.createReader();
      const entries = await new Promise((resolve, reject) => {
        dirReader.readEntries(resolve, reject);
      });
      
      for (const childEntry of entries) {
        await traverseEntry(childEntry, fullPath);
      }
    }
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await traverseEntry(entry);
      }
    }
  }

  return files;
}
