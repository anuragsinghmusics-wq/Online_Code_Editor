export type FileType = 'file' | 'directory'

export interface FileNode {
  name: string
  type: FileType
  path: string
  content?: string
  children?: FileNode[]
  isExpanded?: boolean
}

export interface FlatFileEntry {
  name: string
  content: string
  isFolder?: boolean
}

export interface FileSystemTree {
  [path: string]: FlatFileEntry
}

export interface CreateFileOptions {
  path: string
  content?: string
  isDirectory?: boolean
}

export interface RenameOptions {
  oldPath: string
  newPath: string
}

export interface ReadFileOptions {
  path: string
  encoding?: 'utf8' | 'binary'
}

export interface WriteFileOptions {
  path: string
  content: string
  encoding?: 'utf8' | 'binary'
}
