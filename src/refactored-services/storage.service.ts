import AsyncStorage from '@react-native-community/async-storage';
import {Logger} from './../utils/logger';

export enum StorageKeys {
  MAPPING_KEY = 'mapping',
  THEME_KEY = 'theme',
  TODO_KEY = 'todo',
  EMOTIVITY_FAILED = 'emotivity_failed',
  SAYTHANX_FAILED = 'saythanx_failed',
  NOTIFICATIONS_KEY = 'notifications',
  DAILY_STEPS_GOAL = 'daily_steps_goal',
  SAYTHANX_KEY = 'saythanks_key',
  HAS_LAUNCHED = 'has_launched',
  USER = 'user',
}

export class StorageService {
  async saveToStorage(key: StorageKeys, data: unknown) {
    try {
      Logger.debug('Saving data to the async storage', {data, key});
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      Logger.error('Could not save data to the async storage', {key, data});
      throw new Error(`Async storage error: ${key}`);
    }
  }

  async getDataFromStorage<T>(key: StorageKeys) {
    try {
      Logger.debug('Getting data from the async storage', {key});
      const data = await AsyncStorage.getItem(key);

      if (data) {
        return JSON.parse(data) as T;
      }

      return null;
    } catch (error) {
      Logger.error('Could not retrieve data from storage', {key});
      throw new Error(`Async storage error: ${key}`);
    }
  }
}
