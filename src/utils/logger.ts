/**
 * Production-safe logger utility
 * Only logs in development mode
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// For production error tracking, you could integrate with services like:
// - Sentry
// - LogRocket
// - Rollbar
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (!isDevelopment) {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context });
    console.error('Production error:', error, context);
  } else {
    console.error('Error:', error, context);
  }
};
