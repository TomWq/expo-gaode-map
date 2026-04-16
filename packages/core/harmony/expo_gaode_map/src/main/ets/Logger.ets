import hilog from '@ohos.hilog';

class Logger {
  private domain: number;
  private tag: string;

  constructor(tag: string = 'ExpoGaodeMap', domain: number = 0xFF01) {
    this.tag = tag;
    this.domain = domain;
  }

  info(message: string) {
    hilog.info(this.domain, this.tag, '%{public}s', message);
  }

  warn(message: string) {
    hilog.warn(this.domain, this.tag, '%{public}s', message);
  }

  error(message: string) {
    hilog.error(this.domain, this.tag, '%{public}s', message);
  }
}

export default new Logger();
