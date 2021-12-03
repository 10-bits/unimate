import {faHeart, faThumbsUp} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {
  Button,
  Card,
  CardElement,
  CardProps,
  IconElement,
  StyleService,
  Text,
  useStyleSheet,
} from '@ui-kitten/components';
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {API} from '../refactored-services';
import {Reaction} from '../refactored-services/firestore.service';
import {StorageKeys} from '../refactored-services/storage.service';
import {getDateFromDatabaseDateFormat} from '../utils/date';
import {Action} from '../models/action';
import {ImageOverlay} from './image-overlay.component';
export interface ActionCardProps extends Omit<CardProps, 'children'> {
  data: any;
}

const LikeIcon = (): IconElement => (
  <FontAwesomeIcon icon={faThumbsUp} color={'white'} />
);

const HeartIcon = (): IconElement => (
  <FontAwesomeIcon icon={faHeart} color={'white'} />
);

const LikeIconCicked = (): IconElement => (
  <FontAwesomeIcon icon={faThumbsUp} color={'#712177'} />
);

const HeartIconClicked = (): IconElement => (
  <FontAwesomeIcon icon={faHeart} color={'#712177'} />
);

export const ActionCard = (props: ActionCardProps): CardElement => {
  const styles = useStyleSheet(ActionCardStyles);
  const [isLiked, setLiked] = React.useState<boolean>(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isHearted, setHearted] = React.useState<boolean>(false);
  const [reaction, setReaction] = React.useState<Reaction | null>(null);
  const [likes, setLikes] = React.useState<number>(0);
  const [hearts, setHearts] = React.useState<number>(0);

  const alreadyReacted = isLiked || isHearted;

  const {style, data, ...cardProps} = props;

  let ACTION = data;

  if (data && data !== 'empty') {
    ACTION = new Action(
      data.id,
      getDateFromDatabaseDateFormat(data.data().date),
      data.data().text,
    );
  }

  const onSuccess = useCallback(
    async (documentSnapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
      if (user) {
        let tempLikes = 0;
        let tempTearts = 0;
        setReaction(null);

        const snapData = documentSnapshot.data() as any;
        if (snapData.reacts) {
          snapData.reacts.forEach((reac: Reaction) => {
            if (reac.user === user.uid) {
              setReaction(reac);
            }
            if (reac.type === 'like') {
              tempLikes += 1;
            } else if (reac.type === 'heart') {
              tempTearts += 1;
            }
          });
        }

        if (reaction) {
          setLiked(reaction.type === 'like');
          setHearted(reaction.type === 'heart');
        } else {
          setLiked(false);
          setHearted(false);
        }

        setLikes(tempLikes);
        setHearts(tempTearts);
      }
    },
    [reaction, user],
  );

  const onLike = useCallback(async () => {
    if (user) {
      if (alreadyReacted) {
        if (isHearted) {
          await API.firestore.removeActionCardReaction(ACTION.id, reaction);
        } else if (isLiked) {
          await API.firestore.updateActionCardReaction(
            ACTION.id,
            reaction,
            'like',
            user.uid,
          );
        }
      } else {
        await API.firestore.addActionCardReaction(ACTION.id, 'like', user.uid);
      }
    }
  }, [ACTION.id, alreadyReacted, isHearted, isLiked, reaction, user]);

  const onHeart = useCallback(async () => {
    if (user) {
      if (alreadyReacted) {
        if (isHearted) {
          await API.firestore.removeActionCardReaction(ACTION.id, reaction);
        } else if (isLiked) {
          await API.firestore.updateActionCardReaction(
            ACTION.id,
            reaction,
            'heart',
            user.uid,
          );
        }
      } else {
        await API.firestore.addActionCardReaction(ACTION.id, 'heart', user.uid);
      }
    }
  }, [ACTION.id, alreadyReacted, isHearted, isLiked, reaction, user]);

  useEffect(() => {
    let subscription;
    (async () => {
      const firebaseUser = await API.storage.getDataFromStorage<
        FirebaseAuthTypes.User
      >(StorageKeys.USER);
      setUser(firebaseUser);

      if (data && data !== 'empty') {
        subscription = await API.firestore.subscribeForActionCardReacts(
          ACTION.id,
          onSuccess,
        );
      }
    })();
    return () => {
      subscription();
    };
  }, [ACTION.id, data, onSuccess]);

  if (!data) {
    return (
      <ActivityIndicator
        size="large"
        color="#712177"
        style={{marginVertical: 20}}
      />
    );
  }

  if (data === 'empty') {
    return (
      <Text style={{textAlign: 'center', marginTop: 40}}>
        No Action Cards found for today! 😕
      </Text>
    );
  }

  return (
    <Card {...cardProps} style={[styles.container, style]}>
      <ImageOverlay style={styles.image} source={ACTION.image}>
        <Text style={styles.greeting} category="s1" status="control">
          Tip of the day:
        </Text>
        <Text style={styles.date} category="s1" status="control">
          {ACTION.date}
        </Text>
        <Text style={styles.title} category="h4" status="control">
          {ACTION.title}
        </Text>
        <View style={styles.itemFooter}>
          <TouchableOpacity
            style={[styles.mr, isLiked ? styles.activeLike : styles.inactive]}
            onPress={onLike}>
            <Button
              style={styles.iconButton}
              appearance="ghost"
              status="control"
              textStyle={isLiked ? styles.activeLikeText : null}
              icon={isLiked ? LikeIconCicked : LikeIcon}>
              {likes.toString()}
            </Button>
          </TouchableOpacity>
          <TouchableOpacity
            style={isHearted ? styles.activeHeart : styles.inactive}
            onPress={onHeart}>
            <Button
              style={styles.iconButton}
              appearance="ghost"
              status="control"
              textStyle={isHearted ? styles.activeHeartText : null}
              icon={isHearted ? HeartIconClicked : HeartIcon}>
              {hearts.toString()}
            </Button>
          </TouchableOpacity>
        </View>
      </ImageOverlay>
    </Card>
  );
};

const ActionCardStyles = StyleService.create({
  container: {
    height: 180,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    height: 180,
    paddingVertical: 24,
    paddingHorizontal: 16,
    zIndex: -1,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
  },
  date: {
    position: 'absolute',
    right: 16,
    bottom: 22,
    paddingHorizontal: 0,
    //fontWeight: 'bold'
  },
  itemFooter: {
    position: 'absolute',
    flexDirection: 'row',
    left: 8,
    bottom: 12,
  },
  iconButton: {
    paddingHorizontal: 0,
  },
  activeHeart: {
    borderRadius: 10,
  },
  activeLike: {
    borderRadius: 10,
  },
  activeHeartText: {
    color: '#712177',
  },
  activeLikeText: {
    color: '#712177',
  },
  inactive: {},
  mr: {
    marginRight: 4,
  },
});
