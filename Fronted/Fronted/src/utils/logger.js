const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message, data) => {
    if (isDevelopment) {
      console.log(`ℹ️ ${message}`, data);
    }
  },
  error: (message, error) => {
    if (isDevelopment) {
      console.error(`❌ ${message}`, error);
    }
  },
  success: (message, data) => {
    if (isDevelopment) {
      console.log(`✅ ${message}`, data);
    }
  }
};