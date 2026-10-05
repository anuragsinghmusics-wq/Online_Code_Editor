export type BootStatus = 'idle' | 'booting' | 'ready' | 'error'

export type ServerStatus =
  | 'idle'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'error'
  | 'stopped'

export interface WebContainerState {
  bootStatus: BootStatus
  serverStatus: ServerStatus
  previewUrl: string | null
  serverPort: number | null
  error: string | null
}

export interface BootOptions {
  coep?: string
}

export interface ServerReadyEvent {
  port: number
  baseUrl: string
}

export type WebContainerEventType =
  | 'server-ready'
  | 'port'
  | 'error'

export interface WebContainerError extends Error {
  code?: string
  recoverable?: boolean
}
