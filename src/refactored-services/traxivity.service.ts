import GoogleFit, {Scopes} from 'react-native-google-fit';
import {API} from '.';
import {getSteps} from '../api/googleFitApi';
import {Logger} from '../utils/logger';
import {StorageKeys} from './storage.service';

export class TraxivityService {
  private OPTIONS = {
    scopes: [Scopes.FITNESS_ACTIVITY_READ_WRITE],
  };

  private _goal: number = 0;
  private _steps: number = 0;

  get goal() {
    return this._goal;
  }

  get steps() {
    return this._steps;
  }

  async getSteptsToday(goal: number, onSuccess: () => void) {
    try {
      await GoogleFit.authorize(this.OPTIONS);
      const start = new Date();
      const end = new Date();

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      getSteps(
        {startDate: start, endDate: end},
        null,
        (res: string | any[]) => {
          this._goal = goal;
          this._steps = res.length > 0 ? res[0].value : 0;
          API.storage.saveToStorage(StorageKeys.DAILY_STEPS_GOAL, {goal});
          onSuccess();
        },
      );
    } catch (error) {
      Logger.error('Colud not authorize google fit', error.message);
    }
  }

  getStepsPercentage() {
    var temp = 0;
    if (this._steps > 0 && this._goal > 0) {
      temp = this._steps / this._goal;
    }

    return temp;
  }
}
