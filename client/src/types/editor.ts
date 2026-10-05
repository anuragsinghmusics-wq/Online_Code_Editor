export interface TabData {
  path: string
  isDirty: boolean
  isPinned: boolean
  lastSavedContent: string | null
  previewContent: string | null
}

export type EditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'scss'
  | 'less'
  | 'json'
  | 'jsonc'
  | 'markdown'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'rust'
  | 'go'
  | 'ruby'
  | 'php'
  | 'shell'
  | 'yaml'
  | 'xml'
  | 'sql'
  | 'graphql'

export interface EditorOptions {
  fontSize: number
  fontFamily: string
  minimap: boolean
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  tabSize: number
  insertSpaces: boolean
  lineNumbers: 'on' | 'off' | 'relative' | 'interval'
  formatOnPaste: boolean
  formatOnType: boolean
  autoClosingBrackets: 'always' | 'never' | 'languageDefined' | 'beforeWhitespace'
  autoClosingQuotes: 'always' | 'never' | 'languageDefined' | 'beforeWhitespace'
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full'
  matchBrackets: 'never' | 'near' | 'always'
  scrollBeyondLastLine: boolean
  smoothScrolling: boolean
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  cursorSmoothCaretAnimation: 'off' | 'explicit' | 'on'
  renderLineHighlight: 'none' | 'gutter' | 'line' | 'all'
  padding: { top: number; bottom: number }
  suggestOnTriggerCharacters: boolean
  quickSuggestions: boolean
  acceptSuggestionOnEnter: 'on' | 'smart' | 'off'
}
