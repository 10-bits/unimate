import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {Button, Divider, Input, Layout, Text} from '@ui-kitten/components';
import React, {useEffect, useState} from 'react';
import {Dimensions, Image, StyleSheet, View} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import {ProgressChart} from 'react-native-chart-kit';
import {ScrollView} from 'react-native-gesture-handler';
import MotionSlider from 'react-native-motion-slider';
import * as Progress from 'react-native-progress';
import {API} from 'src/refactored-services';
import {EmotivityRecord} from 'src/refactored-services/emotivity.service';
import {
  Conversation,
  DiaryEntryDoc,
} from 'src/refactored-services/firestore.service';
import {StorageKeys} from 'src/refactored-services/storage.service';
import {getDateToday, getDateTodayNoFormat} from 'src/utils/date';
import {
  ArrowIosBackIcon,
  ArrowIosForwardIcon,
  CheckIcon,
} from '../../components/icons';
import {DIARY, EMOTIVITY, MOOD_SLIDES} from '../../services/types';

const vals = {
  [EMOTIVITY.DATABASE.FIELDS.ANGER]: 0,
  [EMOTIVITY.DATABASE.FIELDS.ANXIETY]: 0,
  [EMOTIVITY.DATABASE.FIELDS.HAPPINESS]: 0,
  [EMOTIVITY.DATABASE.FIELDS.SADNESS]: 0,
  [EMOTIVITY.DATABASE.FIELDS.STRESS]: 0,
  [EMOTIVITY.DATABASE.FIELDS.TIRED]: 0,
};

export const EmotivityTodayScreen = ({navigation}): React.ReactElement => {
  let isFirstRingLegend = true;

  const screenWidth = Dimensions.get('window').width;

  const [scores, setScores] = React.useState<Object>({
    [EMOTIVITY.DATABASE.FIELDS.ANGER]: 0,
    [EMOTIVITY.DATABASE.FIELDS.ANXIETY]: 0,
    [EMOTIVITY.DATABASE.FIELDS.HAPPINESS]: 0,
    [EMOTIVITY.DATABASE.FIELDS.SADNESS]: 0,
    [EMOTIVITY.DATABASE.FIELDS.STRESS]: 0,
    [EMOTIVITY.DATABASE.FIELDS.TIRED]: 0,
  });

  const [isDone, setDone] = React.useState<boolean>(
    API.emotivity.emotivityStatus,
  );

  const [questions_visible, setQuestionsVisible] = React.useState<boolean>(
    false,
  );
  const [question_start_visible, setQuestionStartVisible] = React.useState<
    boolean
  >(false);
  const [question_one_visible, setQuestionOneVisible] = React.useState<boolean>(
    false,
  );
  const [question_two_visible, setQuestionTwoVisible] = React.useState<boolean>(
    false,
  );
  const [question_three_visible, setQuestionThreeVisible] = React.useState<
    boolean
  >(false);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const [prompt_visible, setPromptVisible] = React.useState<boolean>(false);
  const [reflect_visible, setReflectVisible] = React.useState<boolean>(false);

  const [q1, setQ1] = React.useState<string>('');
  const [q2, setQ2] = React.useState<string>('');
  const [q3, setQ3] = React.useState<string>('');
  const [q4, setQ4] = React.useState<string>('');

  const [record_type, setRecordType] = React.useState<string>('');
  const [mood_string, setMoodString] = React.useState<string>('');

  const [diaryData, setDiaryData] = React.useState(undefined);

  useEffect(() => {
    (async () => {
      const firebaseUser = await API.storage.getDataFromStorage<
        FirebaseAuthTypes.User
      >(StorageKeys.USER);
      setUser(firebaseUser);
      if (user) {
        await API.firestore.getTodayDiaryEntry(onSuccess, user.uid);
      }
      setScores(API.emotivity.emotivityRecord);
    })();
  }, []);

  const onSuccess = querySnapshot => {
    console.log('emotoday');
    if (querySnapshot.size === 0) {
      console.warn('Found 0 diary entries for today.');
      setDiaryData('empty');
    } else if (querySnapshot.size > 1) {
      console.warn('Found over 1 diary entries for today.');
      querySnapshot.forEach(documentSnapshot => {
        setDiaryData(documentSnapshot);
      });
    } else {
      querySnapshot.forEach(documentSnapshot => {
        setDiaryData(documentSnapshot);
      });
    }
  };

  const _sendAddDiaryRequest = async () => {
    const convos: Object[] = [];
    if (q1) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q1,
        },
        answer: {
          text: q1,
          time: Date.now(),
        },
      });
    }
    if (q2) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q2,
        },
        answer: {
          text: q2,
          time: Date.now(),
        },
      });
    }
    if (q3) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q3,
        },
        answer: {
          text: q3,
          time: Date.now(),
        },
      });
    }
    const entry: DiaryEntryDoc = {
      user: user ? user.uid : '',
      conversations: convos as Conversation[],
      status: 'Incomplete',
      date: getDateToday(''),
    };
    await API.firestore.addNewDiaryEntry(entry);
  };

  const reflectNowButton = () => {
    setReflectVisible(true);
    setQuestionStartVisible(false);
    setQuestionsVisible(false);
    setQuestionOneVisible(false);
    setQuestionTwoVisible(false);
    setQuestionThreeVisible(false);
  };

  const goToQuestionOneButton = () => {
    setQuestionStartVisible(false);
    setQuestionOneVisible(true);
  };

  const goToQuestionTwoButton = () => {
    setQuestionOneVisible(false);
    setQuestionTwoVisible(true);
  };

  const goToQuestionThreeButton = () => {
    setQuestionTwoVisible(false);
    setQuestionThreeVisible(true);
  };

  const backToQuestionOneButton = () => {
    setQuestionOneVisible(true);
    setQuestionTwoVisible(false);
  };

  const backToQuestionTwoButton = () => {
    setQuestionTwoVisible(true);
    setQuestionThreeVisible(false);
  };

  const reflectLaterButton = async () => {
    _sendAddDiaryRequest();
    await API.firestore.getTodayDiaryEntry(onSuccess, user ? user.uid : '');
    setQuestionsVisible(false);
    setQuestionStartVisible(false);
    setQuestionOneVisible(false);
    setQuestionTwoVisible(false);
    setQuestionThreeVisible(false);
  };

  const diarySkipButton = () => {
    setQuestionsVisible(false);
    setQuestionStartVisible(false);
    setQuestionOneVisible(false);
    setQuestionTwoVisible(false);
    setQuestionThreeVisible(false);
  };

  const renderQuestionsModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>
          📝 New Diary Entry
        </Text>
      </View>

      <Text style={{textAlign: 'justify', marginVertical: 8}}>
        *Fill at least one field to make an entry.
      </Text>
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label={DIARY.DATABASE.QUESTIONS.Q1}
        placeholder="I felt very anxious"
        onChangeText={t => setQ1(t)}
        value={q1}
      />
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label={DIARY.DATABASE.QUESTIONS.Q2}
        placeholder="At home"
        onChangeText={t => setQ2(t)}
        value={q2}
      />
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label={DIARY.DATABASE.QUESTIONS.Q3}
        placeholder="My thesis submission is due next week and i don't think that i would be able to finish it on time."
        multiline={true}
        numberOfLines={3}
        onChangeText={t => setQ3(t)}
        value={q3}
      />
      {/*<Input placeholder='Your thoughts after reflecting:'/>
          <Input placeholder='How you felt after reflecting:'/>*/}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button
          style={[styles.buttonHalf]}
          status="primary"
          onPress={reflectNowButton}
          disabled={q1 || q2 || q3 ? false : true}>
          Reflect Now
        </Button>
        <Button
          style={[styles.buttonHalf]}
          status="primary"
          onPress={reflectLaterButton}
          disabled={q1 || q2 || q3 ? false : true}>
          Reflect Later
        </Button>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button
          style={[styles.buttonFull]}
          status="warning"
          onPress={diarySkipButton}>
          Skip
        </Button>
      </View>
    </Layout>
  );

  const renderQuestionStartModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>
          📝 New Diary Entry
        </Text>
      </View>

      <Text style={{textAlign: 'justify', marginVertical: 8}}>
        Fill at least one field to make an entry.
      </Text>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: '2%',
        }}>
        <Button
          style={[styles.buttonFull]}
          status="primary"
          onPress={goToQuestionOneButton}>
          Start
        </Button>
      </View>
    </Layout>
  );

  const renderQuestionOneModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label={DIARY.DATABASE.QUESTIONS.Q1}
        placeholder="I felt very anxious"
        onChangeText={t => setQ1(t)}
        value={q1}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: '2%',
        }}>
        <Button
          style={[styles.buttonHalf]}
          status="danger"
          onPress={diarySkipButton}>
          Skip
        </Button>
        <Button
          style={[styles.buttonHalf]}
          status="primary"
          onPress={goToQuestionTwoButton}
          disabled={q1 || q2 || q3 ? false : true}>
          Next
        </Button>
      </View>
      <Text style={{alignSelf: 'flex-start', fontSize: 12, marginVertical: 2}}>
        Diary Entry Progress 0%
      </Text>
      <Progress.Bar progress={0} width={300} color="#712177" />
    </Layout>
  );

  const renderQuestionTwoModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label={DIARY.DATABASE.QUESTIONS.Q2}
        placeholder="At home"
        onChangeText={t => setQ2(t)}
        value={q2}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: '2%',
        }}>
        <Button
          style={[styles.buttonOneThird]}
          status="danger"
          onPress={diarySkipButton}>
          Skip
        </Button>
        <Button
          style={[styles.buttonOneThird]}
          status="warning"
          onPress={backToQuestionOneButton}>
          Back
        </Button>
        <Button
          style={[styles.buttonOneThird]}
          status="primary"
          onPress={goToQuestionThreeButton}
          disabled={q1 || q2 || q3 ? false : true}>
          Next
        </Button>
      </View>
      <Text style={{alignSelf: 'flex-start', fontSize: 12, marginVertical: 2}}>
        Diary Entry Progress 33%
      </Text>
      <Progress.Bar progress={0.33} width={300} color="#712177" />
    </Layout>
  );

  const renderQuestionThreeModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label={DIARY.DATABASE.QUESTIONS.Q3}
        placeholder="My thesis submission is due next week and i don't think that i would be able to finish it on time."
        multiline={true}
        numberOfLines={3}
        onChangeText={t => setQ3(t)}
        value={q3}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: '2%',
        }}>
        <Button
          style={[styles.buttonOneThird]}
          status="danger"
          onPress={diarySkipButton}>
          Skip
        </Button>
        <Button
          style={[styles.buttonOneThird]}
          status="primary"
          onPress={reflectNowButton}
          disabled={q1 || q2 || q3 ? false : true}>
          Reflect Now
        </Button>
        <Button
          style={[styles.buttonOneThird]}
          status="warning"
          onPress={reflectLaterButton}
          disabled={q1 || q2 || q3 ? false : true}>
          Reflect Later
        </Button>
      </View>
      <Text style={{alignSelf: 'flex-start', fontSize: 12, marginVertical: 2}}>
        Diary Entry Progress 66%
      </Text>
      <Progress.Bar progress={0.66} width={300} color="#712177" />
    </Layout>
  );
  const reflectSubmitButton = async () => {
    const convos: Object[] = [];
    if (q1) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q1,
        },
        answer: {
          text: q1,
          time: Date.now(),
        },
      });
    }
    if (q2) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q2,
        },
        answer: {
          text: q2,
          time: Date.now(),
        },
      });
    }
    if (q3) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q3,
        },
        answer: {
          text: q3,
          time: Date.now(),
        },
      });
    }
    const entry: DiaryEntryDoc = {
      user: user ? user.uid : '',
      status: 'Complete',
      conversations: [
        ...convos,
        {
          question: {
            text: DIARY.DATABASE.QUESTIONS.Q4,
          },
          answer: {
            text: q4,
            time: Date.now(),
          },
        },
      ] as Conversation[],
      date: getDateToday(''),
    };
    await API.firestore.addNewDiaryEntry(entry);
    await API.firestore.getTodayDiaryEntry(onSuccess, user ? user.uid : '');
    setReflectVisible(!reflect_visible);
  };

  const laterButton = () => {
    if (user) {
      _sendAddDiaryRequest();
      API.firestore.getTodayDiaryEntry(onSuccess, user.uid);
      setReflectVisible(false);
    } else {
      throw new Error('User not exist');
    }
  };

  const backButton = () => {
    setReflectVisible(false);
    // setQuestionsVisible(true);
    setQuestionStartVisible(true);
  };

  const renderReflectModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>
          🤔 Today's Reflection
        </Text>
      </View>

      {/*<Text style={{textAlign: 'justify', marginBottom: 8}}>
            Explain the role of the diary entry briefly. about reclecting etc.
    </Text>*/}
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={[styles.label, {marginBottom: 16}]}
        label="Your thoughts after reflecting and how you felt after reflecting on today:"
        placeholder="Reflecting is about questioning, in a positive way, what you do and why you do it and then deciding whether there is a better, or more efficient, way of doing it in the future."
        multiline={true}
        size="small"
        numberOfLines={5}
        onChangeText={t => setQ4(t)}
        value={q4}
      />
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button
          style={[styles.buttonFull]}
          status="primary"
          onPress={reflectSubmitButton}
          disabled={q4 ? false : true}>
          Submit
        </Button>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button
          style={[styles.buttonHalf]}
          status={'warning'}
          onPress={backButton}>
          Back
        </Button>
        <Button
          style={[styles.buttonHalf]}
          status={'warning'}
          onPress={laterButton}>
          Reflect Later
        </Button>
      </View>
    </Layout>
  );

  const proceedButton = () => {
    setPromptVisible(!prompt_visible);
    setQuestionsVisible(!questions_visible);
    setQuestionStartVisible(!question_start_visible);
  };

  const togglePromptModal = () => {
    setDone(true);
    setPromptVisible(!prompt_visible);
  };

  const renderPromptModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>
        🙌 Thank You!
      </Text>
      {record_type === 'positive' && (
        <Text style={{textAlign: 'justify'}}>
          Seems like you've had a good day 😄. That's great to hear! Would you
          like to make a note on today's events and reflect on them?
        </Text>
      )}
      {record_type === 'negative' && (
        <Text style={{textAlign: 'justify'}}>
          We noticed that you have felt a noticable amount of
          <Text style={{color: '#712177', fontWeight: 'bold'}}>
            {' '}
            {mood_string}{' '}
          </Text>
          today. We believe that making a note about the events and reflecting
          on them can actually help. Would you like to make a new diary entry?
        </Text>
      )}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button
          style={[styles.buttonHalf]}
          status="primary"
          onPress={proceedButton}>
          Yes
        </Button>
        <Button
          style={[styles.buttonHalf]}
          status="warning"
          onPress={togglePromptModal}>
          Skip
        </Button>
      </View>
    </Layout>
  );

  const onMoodScoreSubmit = async () => {
    // Get all the negatives that are >= 3

    const moods: string[] = [];
    if (scores[EMOTIVITY.DATABASE.FIELDS.ANGER] > 2) {
      moods.push('Anger');
    }
    if (scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY] > 2) {
      moods.push('Anxiety');
    }
    if (scores[EMOTIVITY.DATABASE.FIELDS.SADNESS] > 2) {
      moods.push('Sadness');
    }
    if (scores[EMOTIVITY.DATABASE.FIELDS.STRESS] > 2) {
      moods.push('Stress');
    }
    if (scores[EMOTIVITY.DATABASE.FIELDS.TIRED] > 2) {
      moods.push('Tired');
    }

    // Generate the modal based on the negatives >= 3

    if (moods.length === 0) {
      setRecordType('positive');
    } else if (moods.length === 1) {
      setRecordType('negative');
      setMoodString(moods[0]);
    } else {
      setRecordType('negative');
      setMoodString(
        [moods.slice(0, -1).join(', '), moods.slice(-1)[0]].join(
          moods.length < 2 ? '' : ' and ',
        ),
      );
    }

    togglePromptModal();
    console.log('scores');
    console.log(scores);
    const moodTrackingRecord: EmotivityRecord = {
      anger: scores[EMOTIVITY.DATABASE.FIELDS.ANGER],
      anxiety: scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY],
      happiness: scores[EMOTIVITY.DATABASE.FIELDS.HAPPINESS],
      sadness: scores[EMOTIVITY.DATABASE.FIELDS.SADNESS],
      stress: scores[EMOTIVITY.DATABASE.FIELDS.STRESS],
      tired: scores[EMOTIVITY.DATABASE.FIELDS.TIRED],
    };
    await API.firestore.adMoodTrackingRecord(
      moodTrackingRecord,
      user ? user.uid : '',
    );
    //Mark emotivity Completed for today
    await API.storage.saveToStorage(StorageKeys.EMOTIVITY_FILLED, {
      date: getDateTodayNoFormat(),
      action: 'Completed',
    });
  };

  const onChange = (key, value) => {
    vals[key] = value;
  };

  const onDrop = key => {
    console.log('drop');
    setScores(vals);
  };

  const emotivitySlide = ({item}) => {
    return (
      <View style={styles.slide}>
        <Text style={styles.title}>{item.title}</Text>
        <Image
          style={[
            scores[item.key] == 0
              ? {transform: [{scale: 0.5}]}
              : {transform: [{scale: parseInt(scores[item.key]) * 0.1 + 0.5}]},
            styles.icon,
          ]}
          source={item.image}
        />
        <Text style={styles.text}>{item.text}</Text>
        <MotionSlider
          min={0}
          max={5}
          value={0}
          //value={scores[item.key]}
          height={65}
          decimalPlaces={0}
          fontSize={18}
          backgroundColor={item.type === 'positive' ? ['#5A1866'] : ['#5A1866']}
          onValueChanged={value => onChange(item.key, value)}
          onPressOut={() => onDrop(item.key)}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '68%',
          }}>
          <Text style={[styles.hint, {textAlign: 'left'}]}>
            {item.labels.min}
          </Text>
          <Text style={[styles.hint, {textAlign: 'right'}]}>
            {item.labels.max}
          </Text>
        </View>
        <Layout style={styles.margin} />
      </View>
    );
  };

  const _renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <ArrowIosForwardIcon
          fill={'rgba(255, 255, 255, .9)'}
          style={{backgroundColor: 'transparent'}}
        />
      </View>
    );
  };

  const _renderPrevButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <ArrowIosBackIcon
          fill={'rgba(255, 255, 255, .9)'}
          style={{backgroundColor: 'transparent'}}
        />
      </View>
    );
  };

  const _renderDoneButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <CheckIcon style={{backgroundColor: 'transparent'}} />
      </View>
    );
  };

  if (!isDone) {
    return (
      <Layout style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <AppIntroSlider
          slides={MOOD_SLIDES}
          renderItem={emotivitySlide}
          showPrevButton={true}
          scrollEnabled={false}
          renderNextButton={_renderNextButton}
          renderPrevButton={_renderPrevButton}
          renderDoneButton={_renderDoneButton}
          //extraData={this.state}
          onDone={onMoodScoreSubmit}
        />
      </Layout>
    );
  }

  return (
    <Layout style={{height: '100%'}}>
      <ScrollView
        style={{
          flex: 1,
          alignSelf: 'center',
          backgroundColor: 'white',
          paddingHorizontal: 10,
        }}>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 20,
            marginTop: 20,
            textAlign: 'center',
          }}>
          {`${getDateToday()}`}
        </Text>
        <Divider
          style={{width: '100%', alignSelf: 'center', marginVertical: 10}}
        />
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 20,
            marginTop: 10,
            textAlign: 'center',
          }}>
          Mood Summary
        </Text>
        <Divider style={styles.divider} />
        <ProgressChart
          data={{
            labels: [
              'Anger -',
              'Anxiety -',
              'Sadness -',
              'Stress -',
              'Tiredness -',
              'Happy -',
            ],
            data: [
              scores[EMOTIVITY.DATABASE.FIELDS.ANGER] / 5,
              scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY] / 5,
              scores[EMOTIVITY.DATABASE.FIELDS.SADNESS] / 5,
              scores[EMOTIVITY.DATABASE.FIELDS.STRESS] / 5,
              scores[EMOTIVITY.DATABASE.FIELDS.TIRED] / 5,
              scores[EMOTIVITY.DATABASE.FIELDS.HAPPINESS] / 5,
            ],
          }}
          width={screenWidth}
          height={screenWidth / 1.5}
          chartConfig={{
            backgroundColor: 'white',
            backgroundGradientFrom: 'white',
            backgroundGradientTo: 'white',
            color: (opacity = 1) => {
              if (
                opacity === 1.2000000000000002 ||
                opacity === 0.9166666666666667
              ) {
                // 6th/Outer Ring - Happiness
                return '#069E73';
              } else if (opacity === 1 || opacity === 0.8333333333333333) {
                //5th Ring - Tired
                return '#D55E00';
              } else if (opacity === 0.8 || opacity === 0.75) {
                //4th Ring - Stress
                return '#E69F03';
              } else if (
                opacity === 0.6000000000000001 ||
                opacity === 0.6666666666666666
              ) {
                // 3rd Ring - Sad
                return '#CC79A7';
              } else if (opacity === 0.4 || opacity === 0.5833333333333334) {
                // 2nd Ring - Anxiety
                if (opacity === 0.5833333333333334) {
                  isFirstRingLegend = true;
                }
                return '#57B4E9';
              } else if (opacity === 0.2) {
                // 1st Ring Legend
                if (isFirstRingLegend) {
                  isFirstRingLegend = false;
                  return '#0172B2';
                } else {
                  return 'rgba(113, 33, 119, 0.2)';
                }
              } else if (opacity === 0.5) {
                // 1st Ring - Anger
                return '#0172B2';
              } else {
                return `rgba(113, 33, 119, ${opacity})`;
              }
            },
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            strokeWidth: 1,
          }}
          hideLegend={false}
          style={{
            marginLeft: -20,
          }}
        />
        {/* <Divider style={styles.divider} />
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 20,
            marginBottom: 16,
            textAlign: 'center',
          }}>
          Diary Entry
        </Text> */}
        {/* <Modal backdropStyle={styles.backdrop} visible={questions_visible}>
                {renderQuestionsModal()}
            </Modal> */}
        {/* <Modal backdropStyle={styles.backdrop} visible={question_start_visible}>
          {renderQuestionStartModal()}
        </Modal>
        <Modal backdropStyle={styles.backdrop} visible={question_one_visible}>
          {renderQuestionOneModal()}
        </Modal>
        <Modal backdropStyle={styles.backdrop} visible={question_two_visible}>
          {renderQuestionTwoModal()}
        </Modal>
        <Modal backdropStyle={styles.backdrop} visible={question_three_visible}>
          {renderQuestionThreeModal()}
        </Modal>
        <Modal backdropStyle={styles.backdrop} visible={prompt_visible}>
          {renderPromptModal()}
        </Modal>
        <Modal backdropStyle={styles.backdrop} visible={reflect_visible}>
          {renderReflectModal()}
        </Modal>
        <View style={{marginBottom: 16}}>
          <DiaryEntry entry={diaryData} />
          {diaryData === 'empty' && (
            <Button
              onPress={() => setQuestionStartVisible(true)}
              style={{marginHorizontal: 20}}>
              Add Entry
            </Button>
          )}
        </View> */}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  divider: {
    width: '50%',
    backgroundColor: '#ddd',
    alignSelf: 'center',
    height: 1,
    marginVertical: 16,
    borderRadius: 5,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    padding: 16,
    borderRadius: 5,
  },
  input: {
    marginTop: 8,
  },
  inputText: {
    paddingTop: 2,
    textAlignVertical: 'top',
  },
  label: {
    color: 'black',
    fontSize: 14,
  },
  buttonFull: {
    width: '100%',
    marginTop: 16,
    marginHorizontal: 5,
  },
  buttonHalf: {
    width: '48%',
    marginTop: 16,
    marginHorizontal: 5,
  },
  buttonOneThird: {
    width: '31%',
    marginTop: 16,
    marginHorizontal: 5,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#712177',
  },
  title: {
    fontSize: 24,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingTop: 16,
    marginBottom: 16,
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingBottom: 24,
    paddingTop: 16,
    fontWeight: 'bold',
    fontSize: 16,
  },
  icon: {
    width: '30%',
    height: '30%',
    resizeMode: 'contain',
    paddingVertical: '15%',
  },
  hint: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    paddingTop: 12,
    fontWeight: 'bold',
    width: '50%',
  },
  margin: {
    height: '10%',
  },
  buttonCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
