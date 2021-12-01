import {firebase, FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {getDateToday} from '../utils/date';
import {Notification} from '../models/notification';
import {Logger} from '../utils/logger';

export type REACTION_TYPE = 'heart' | 'like';
export interface Reaction {
  type: REACTION_TYPE;
  user: string;
}

export class FirestoreService {
  async storeUserInFirestore(user: FirebaseAuthTypes.User) {
    try {
      Logger.debug('Storing user in firestore', user);
      const ref = firestore()
        .collection('users')
        .doc(user.uid);

      await firestore().runTransaction(async t => {
        const doc = await t.get(ref);
        if (!doc.exists) {
          return t.set(ref, {
            user,
            dailyStepGoal: 5000,
            notifications: [
              new Notification(
                'Welcome to Unimate!',
                'Thanks for using Unimate!',
                Date.now(),
                'Emotivity',
                false,
              ),
              new Notification(
                'Reminder: Daily Step Goal',
                "Don't forget to keep up with your daily step goal!",
                Date.now(),
                'Traxivity',
                false,
              ),
              new Notification(
                'Reminder: Mood Tracking',
                'Track your mood daily and keep track of your moods!',
                Date.now(),
                'Emotivity',
                true,
              ),
              new Notification(
                'Reminder: Mood Diary',
                'Add daily diary records and reflect on them.',
                Date.now(),
                'Emotivity',
                false,
              ),
            ],
          });
        } else {
          return t.update(ref, {user});
        }
      });
    } catch (error) {
      Logger.error('Storing user in firestore failed', error.message);
      throw new Error('Failed to store user in firestore');
    }
  }

  async subscribeForEmotivity(
    userId: string,
    onNext: (data: FirebaseFirestoreTypes.QuerySnapshot) => void,
  ) {
    return firestore()
      .collection('mood_tracking')
      .where('user', '==', userId)
      .where('date', '==', getDateToday(''))
      .onSnapshot(onNext, error => Logger.error(error.message));
  }

  async subscribeForTraxivity(
    userId: string,
    onNext: (data: FirebaseFirestoreTypes.DocumentSnapshot) => void,
  ) {
    return firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(onNext, error => Logger.error(error.message));
  }

  // TODO: add reaction type
  async removeActionCardReaction(actionCardId: string, oldReaction: unknown) {
    try {
      Logger.debug('Removing action card reaction', {
        actionCardId,
        oldReaction,
      });
      await firestore()
        .collection('action_cards')
        .doc(actionCardId)
        .update({
          reacts: firebase.firestore.FieldValue.arrayRemove(oldReaction),
        });
    } catch (error) {
      Logger.error(`Could not remove action card reaction: ${error.message}`);
      throw new Error(error.message);
    }
  }

  // TODO: add reaction type
  async updateActionCardReaction(
    actionCardId: string,
    oldReaction: unknown,
    reactionType: REACTION_TYPE,
    userId: string,
  ) {
    try {
      Logger.debug('Updating action card reaction', {
        actionCardId,
        oldReaction,
        reactionType,
        userId,
      });
      await firestore()
        .collection('action_cards')
        .doc(actionCardId)
        .update({
          reacts: firebase.firestore.FieldValue.arrayRemove(oldReaction),
        });
      await firestore()
        .collection('action_cards')
        .doc(actionCardId)
        .update({type: reactionType, user: userId});
    } catch (error) {
      Logger.error(`Could not update reaction: ${error.message}`);
      throw new Error(error.message);
    }
  }

  // TODO: add reaction type
  async addActionCardReaction(
    actionCardId: string,
    reactionType: REACTION_TYPE,
    userId: string,
  ) {
    try {
      Logger.debug('Adding new reaction to action card', {
        actionCardId,
        reactionType,
        userId,
      });
      await firestore()
        .collection('action_cards')
        .doc(actionCardId)
        .update({type: reactionType, user: userId});
    } catch (error) {
      Logger.error('Error while adding reaction to action card', error);
      throw new Error(error.message);
    }
  }

  async subscribeForActionCardReacts(
    docId: string,
    onSuccess: (snap: FirebaseFirestoreTypes.DocumentSnapshot) => void,
  ) {
    return firestore()
      .collection('action_cards')
      .doc(docId)
      .onSnapshot(onSuccess, error => Logger.error(error.message));
  }
}
