export const promptSelector = 'textarea, [data-testid="prompt-input"], input[placeholder*="Message"], [contenteditable="true"]'
export const terminalSelector = '[data-testid="terminal"], .xterm, [class*="terminal"]'
// Status button - more specific to avoid matching file tree items
export const statusButtonSelector = 'button[class*="rounded-full"]:has-text("Connected"), button[class*="rounded-full"]:has-text("Offline"), [data-testid="status-button"]'
// Model selector shows "Select" or model name, not "model"
export const modelPickerSelector = 'button:has-text("Select"), button:has([class*="Sparkles"]), button[class*="bg-black/5"]:has(svg), [class*="ModelSelector"] > button'
export const agentPickerSelector = 'button:has-text("build"), button:has-text("plan"), [data-testid="agent-selector"]'
export const sendButtonSelector = 'button:has-text("SEND"), button[type="submit"], button:has([aria-label*="send"])'
export const fileTreeSelector = 'div:has-text("Workspace"), [data-testid="file-tree"], [class*="FileTree"]'
export const newSessionButtonSelector = 'button:has-text("New session"), button:has-text("+"), [data-testid="new-session"]'
export const projectRailSelector = '[class*="ProjectRail"], aside[class*="w-\\[68px\\]"]'
// The chat interface appears after clicking "New session"
export const chatInterfaceSelector = 'textarea, [class*="MessageList"], [class*="PromptInput"]'
