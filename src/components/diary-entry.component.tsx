import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import {
  Avatar,
  Button,
  CardElement,
  CardProps,
  Input,
  Layout,
  StyleService,
  Text,
  useStyleSheet,
} from '@ui-kitten/components';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  TouchableHighlight,
  View,
  ViewStyle,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {API} from 'src/refactored-services';
import {
  Conversation,
  DiaryEntry,
} from 'src/refactored-services/firestore.service';
import {getRelativeTime} from 'src/utils/date';
import {Message} from '../models/message';
import {DIARY} from '../services/types';
import {UtilService} from '../services/util.service';
import {Chat} from './chat.component';
import {ArrowHeadDownIcon, ArrowHeadUpIcon, PaperPlaneIcon} from './icons';
import {KeyboardAvoidingView} from './keyboard-avoiding-view.component';

export interface DiaryEntryProps extends Omit<CardProps, 'children'> {
  entry: DiaryEntry | 'empty';
  style: StyleProp<ViewStyle>;
}

const keyboardOffset = (height: number): number =>
  Platform.select({
    android: 0,
    ios: height,
  });

const DiaryEntry = (props: DiaryEntryProps): CardElement => {
  const styles = useStyleSheet(themedStyles);

  const {entry, style} = props;

  const [expanded, setExpanded] = useState<boolean>(false);
  const [reflected, setReflected] = useState<boolean>(false);
  const [animation] = useState(new Animated.Value(45));
  const [maxHeight, setMaxHeight] = useState<number>(200);
  const [minHeight, setMinHeight] = useState<number>(45);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string | null | undefined>(null);

  const onSuccess = useCallback(
    (diaryEntrySnapshot: FirebaseFirestoreTypes.DocumentSnapshot) => {
      const tempNewMessages: Message[] = [];
      const diaryEntry = diaryEntrySnapshot.data() as DiaryEntry;

      diaryEntry.conversations.forEach(item => {
        tempNewMessages.push(
          {text: item.question.text, date: '', reply: false},
          {
            text: item.answer.text,
            date: getRelativeTime(item.answer.time),
            reply: true,
          },
        );
      });

      if (diaryEntry.status === 'Complete') {
        setReflected(true);
      } else {
        setReflected(false);
        tempNewMessages.push({
          text: DIARY.DATABASE.QUESTIONS.Q4,
          date: '',
          reply: false,
        });
      }

      setMessages(tempNewMessages);
    },
    [],
  );

  const sendButtonEnabled = useCallback(() => !!message && message.length > 0, [
    message,
  ]);

  const onSendButtonPress = useCallback(async () => {
    if (entry !== 'empty') {
      const conversation: Conversation = {
        question: {text: DIARY.DATABASE.QUESTIONS.Q4},
        answer: {text: message as string, time: Date.now()},
      };
      await API.firestore.addReflection(entry.id, conversation);
      Keyboard.dismiss();
    }
  }, [entry, message]);

  const setMaxHeightF = useCallback(
    (event: LayoutChangeEvent) => setMaxHeight(event.nativeEvent.layout.height),
    [],
  );

  const setMinHeightF = useCallback(
    (event: LayoutChangeEvent) => setMinHeight(event.nativeEvent.layout.height),
    [],
  );

  const toggle = useCallback(() => {
    const initialValue = expanded ? maxHeight + minHeight : minHeight;
    const finalValue = expanded ? minHeight : maxHeight + minHeight;

    setExpanded(!expanded);
    animation.setValue(initialValue);
    Animated.spring(animation, {toValue: finalValue}).start();
  }, [animation, expanded, maxHeight, minHeight]);

  useEffect(() => {
    let unsubscribe;
    (async () => {
      if (entry && entry !== 'empty') {
        unsubscribe = await API.firestore.subscribeForDiaryEntry(
          entry.id,
          onSuccess,
        );
      }
    })();
    return () => {
      unsubscribe();
    };
  }, [entry, onSuccess]);

  if (!entry) {
    return (
      <ActivityIndicator
        size="large"
        color="#712177"
        style={{marginBottom: 20}}
      />
    );
  }

  if (entry === 'empty') {
    return (
      <Text style={{textAlign: 'center', marginVertical: 10}}>
        You didn't add an entry for today! 😕
      </Text>
    );
  }

  return (
    <Layout
      style={[
        style,
        {
          borderRadius: 5,
          borderColor: '#DDD',
          borderWidth: 2,
          marginHorizontal: 16,
          marginVertical: 4,
        },
      ]}>
      <Animated.View
        style={{height: animation, marginBottom: expanded ? 45 : 0}}>
        <View onLayout={setMinHeightF}>
          <TouchableHighlight
            onPress={toggle}
            underlayColor="#f1f1f1"
            style={{borderRadius: 5}}>
            <View
              style={[
                styles.topContainer,
                expanded ? styles.borderBottom : '',
              ]}>
              <Avatar
                style={{height: 24, width: 24, marginLeft: 10, marginRight: 10}}
                source={require('../assets/images/emotivity.png')}
              />
              <Text style={styles.headerText} category="h6">
                {UtilService.getDateFromDatabaseDateFormat(
                  entry.data()[DIARY.DATABASE.FIELDS.DATE],
                )}
              </Text>
              {reflected && (
                <Text
                  style={[styles.headerText, styles.tag, styles.complete]}
                  category="h6">
                  Complete
                </Text>
              )}
              {!reflected && (
                <Text
                  style={[styles.headerText, styles.tag, styles.incomplete]}
                  category="h6">
                  Incomplete
                </Text>
              )}
              <View style={{position: 'absolute', right: 20, top: 11}}>
                {expanded
                  ? ArrowHeadUpIcon(styles.icon)
                  : ArrowHeadDownIcon(styles.icon)}
              </View>
            </View>
          </TouchableHighlight>
        </View>
        <View style={styles.body} onLayout={setMaxHeightF}>
          <View style={expanded ? {} : {display: 'none'}}>
            <ScrollView>
              <Chat
                style={styles.list}
                contentContainerStyle={styles.listContent}
                followEnd={true}
                data={messages}
              />
            </ScrollView>
          </View>
        </View>
      </Animated.View>
      {!reflected && (
        <KeyboardAvoidingView
          style={styles.messageInputContainer}
          offset={keyboardOffset}>
          <Input
            style={styles.messageInput}
            placeholder={expanded ? 'Reply...' : 'Thoughts after reflecting?'}
            value={message}
            onChangeText={setMessage}
          />
          <Button
            appearance="outline"
            style={[styles.iconButton, styles.sendButton]}
            icon={PaperPlaneIcon}
            disabled={!sendButtonEnabled()}
            onPress={onSendButtonPress}
          />
        </KeyboardAvoidingView>
      )}
    </Layout>
  );
};

export default DiaryEntry;

const themedStyles = StyleService.create({
  headerText: {
    fontWeight: '400',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  tag: {
    fontSize: 12,
    //borderWidth: 1,
    marginLeft: 10,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  complete: {
    borderColor: '#027352',
    backgroundColor: '#92F0B9',
  },
  incomplete: {
    borderColor: '#A3223C',
    backgroundColor: '#F5AEA7',
  },
  topContainer: {
    padding: 10,
    flexDirection: 'row',
    //justifyContent: 'space-between',
    overflow: 'hidden',
  },
  borderBottom: {
    borderBottomColor: '#DDD',
    borderBottomWidth: 1,
  },
  valueLabel: {
    marginTop: 10,
  },
  cardHeader: {
    backgroundColor: 'color-success-100',
  },
  icon: {
    marginTop: 2,
    width: 20,
    height: 20,
  },
  body: {
    minHeight: 120,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: 'background-basic-color-1',
    borderTopColor: '#DDD',
    borderTopWidth: 1,
    borderRadius: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  sendButton: {
    marginRight: 6,
  },
  iconButton: {
    width: 24,
    height: 24,
  },
});
