/**
 * Development-only logging utility
 * Only logs in development mode to avoid cluttering production logs
 */
export const devLog = (message: string, ...args: any[]): void => {
  if (__DEV__) {
    console.log(message, ...args);
  }
};

export const devError = (message: string, ...args: any[]): void => {
  if (__DEV__) {
    console.error(message, ...args);
  }
};