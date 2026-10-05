export interface TerminalSession {
  id: string
  cols: number
  rows: number
  isRunning: boolean
  history: string[]
}

export interface TerminalWriteData {
  data: string
}

export interface TerminalResizeData {
  cols: number
  rows: number
}

export type TerminalCommand =
  | 'npm install'
  | 'npm run dev'
  | 'npm run build'
  | 'npm run test'
  | 'node'
  | 'npx'
  | 'clear'
  | string
