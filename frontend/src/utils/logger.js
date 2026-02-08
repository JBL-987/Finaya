export const logger = {
  log: (message, data) => {
    if (import.meta.env.MODE === 'development') {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  },
  error: (message, error) => {
    // Always log errors, but in production we can limit detail or send to a monitoring service
    if (import.meta.env.MODE === 'development') {
      if (error) {
        console.error(message, error);
      } else {
        console.error(message);
      }
    } else {
      // Production Logging - cleaner
      // In a real app, you might send this to Sentry/LogRocket
      if (error) {
        console.error(`${message}: ${error.message || error}`);
      } else {
        console.error(message);
      }
    }
  },
  warn: (message, data) => {
    if (import.meta.env.MODE === 'development') {
        if (data) {
          console.warn(message, data);
        } else {
          console.warn(message);
        }
    }
  }
};

export default logger;
