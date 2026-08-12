type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix = '[PixelPaw]';

  private format(level: LogLevel, message: string): string {
    return `${this.prefix} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.format('debug', message));
    }
  }

  info(message: string): void {
    console.info(this.format('info', message));
  }

  warn(message: string): void {
    console.warn(this.format('warn', message));
  }

  error(message: string, error?: unknown): void {
    console.error(this.format('error', message), error);
  }
}

export const logger = new Logger();
