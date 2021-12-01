// import crashlytics from '@react-native-firebase/crashlytics';

export class Logger {
  private static logLevel = 10;

  static debug(message: string, ...data: any[]) {
    if (this.logLevel >= 4) {
      this.consoleLog('DEBUG', message, data);
    }
  }

  static info(message: string, ...data: any[]) {
    if (this.logLevel >= 3) {
      this.consoleLog('INFO', message, data);
    }
  }

  static warn(message: string, ...data: any[]) {
    if (this.logLevel >= 2) {
      this.consoleLog('WARN', message, data);
    }
  }

  static error(message: string, ...data: any[]) {
    if (this.logLevel >= 1) {
      this.consoleLog('ERROR', message, data);
    }
  }

  private static consoleLog(type: string, message: string, ...data: any[]) {
    const now = new Date().toLocaleDateString();
    console.log(`[${now}:${type}]: `, message, ...(data && data));
    // crashlytics().log(`${type}:${message}`);
  }
}
