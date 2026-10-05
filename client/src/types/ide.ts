export type PanelDirection = 'horizontal' | 'vertical'

export type SidebarView = 'explorer' | 'search' | 'git' | 'extensions' | 'settings'

export type BottomPanelView = 'terminal' | 'preview' | 'problems' | 'output'

export interface PanelSizes {
  sidebar: number
  editor: number
  preview: number
  terminal: number
}

export interface IDELayout {
  sidebarVisible: boolean
  terminalVisible: boolean
  previewVisible: boolean
  activeSidebarView: SidebarView
  activeBottomPanel: BottomPanelView
  panelSizes: PanelSizes
}

export interface StatusBarItem {
  id: string
  label: string
  icon?: string
  tooltip?: string
  position: 'left' | 'right'
}
