export interface EmotivityRecord {
  anger: number; // 6
  anxiety: number; // 10
  happiness: number; // 2
  sadness: number; // 10
  stress: number; // 10
  tired: number; // 100
}

export class EmotivityService {
  private emotivityStatus: boolean = false;
  private emotivityRecord: EmotivityRecord = {
    anger: 0,
    anxiety: 0,
    happiness: 0,
    sadness: 0,
    stress: 0,
    tired: 0,
  };

  setEmotivityDetails(status: boolean, document?: EmotivityRecord) {
    this.emotivityStatus = status;
    if (status && document) {
      this.emotivityRecord = document;
    }
  }
}
