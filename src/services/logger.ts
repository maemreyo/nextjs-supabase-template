import { createConsola, LogLevels } from 'consola';

const logger = createConsola({
  level: process.env.LOG_LEVEL 
    ? parseInt(process.env.LOG_LEVEL) 
    : (process.env.NODE_ENV === 'production' ? LogLevels.warn : LogLevels.debug),
  
  formatOptions: {
    colors: true,
    date: true,
    compact: process.env.NODE_ENV === 'production',
  },
  
  // Tắt log ở client trong production
  ...(typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && {
    level: LogLevels.silent,
  }),
});

// Tạo các logger riêng cho từng module
export const apiLogger = logger.withTag('API');
export const dbLogger = logger.withTag('Database');
export const authLogger = logger.withTag('Auth');
export const clientLogger = logger.withTag('Client');

export default logger;