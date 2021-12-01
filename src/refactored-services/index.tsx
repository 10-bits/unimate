import Config from 'react-native-config';
import {AuthService} from './auth.service';
import {EmotivityService} from './emotivity.service';
import {FirestoreService} from './firestore.service';
import {NotificationsService} from './notifications.service';
import {StorageService} from './storage.service';
import {TraxivityService} from './traxivity.service';

interface APIServices {
  auth: AuthService;
  storage: StorageService;
  traxivity: TraxivityService;
  firestore: FirestoreService;
  notifications: NotificationsService;
  emotivity: EmotivityService;
}

interface Configs {
  WEB_CLIENT_ID: string;
}

export const API: APIServices = {
  auth: new AuthService(),
  storage: new StorageService(),
  traxivity: new TraxivityService(),
  firestore: new FirestoreService(),
  notifications: new NotificationsService(),
  emotivity: new EmotivityService(),
};

export const configs: Configs = {
  WEB_CLIENT_ID: Config.WEB_CLIENT_ID,
};
