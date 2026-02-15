/**
 * Development-only logging utility for Node.js
 * Tree-shakeable in production builds (removed when NODE_ENV is production)
 */

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Create a namespaced logger for development debugging
 * @param namespace Component or module name (e.g., 'HubServer')
 * @returns Logger instance that only logs in development mode
 */
export function createLogger(namespace: string): Logger {
  const isDev = process.env.NODE_ENV !== 'production';
  
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.log(`[${namespace}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (isDev) {
        console.info(`[${namespace}] ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${namespace}] ${message}`, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${namespace}] ${message}`, ...args);
    },
  };
}
