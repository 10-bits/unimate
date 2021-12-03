import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  Button,
  Divider,
  Input,
  Layout,
  Tab,
  TabView,
  Text,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import moment from 'moment';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { ProgressChart } from 'react-native-chart-kit';
import { ScrollView } from 'react-native-gesture-handler';
import MotionSlider from 'react-native-motion-slider';
import { API } from 'src/refactored-services';
import { EmotivityRecord } from 'src/refactored-services/emotivity.service';
import { Conversation, DiaryEntryDoc } from 'src/refactored-services/firestore.service';
import { StorageKeys } from 'src/refactored-services/storage.service';
import { getDateToday, getDateWeekAgo } from 'src/utils/date';
import DiaryEntry from '../../components/diary-entry.component';
import {
  ArrowIosBackIcon,
  ArrowIosForwardIcon,
  CheckIcon,
  MenuIcon,
} from '../../components/icons';
import { SafeAreaLayout } from '../../components/safe-area-layout.component';
import { DATE, DIARY, EMOTIVITY } from '../../services/types';
import { UtilService } from '../../services/util.service';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const moods = [
  {
    key: EMOTIVITY.DATABASE.FIELDS.HAPPINESS,
    title: 'Happiness',
    text: 'How happy are you today?',
    image: require('../../assets/images/happy.png'),
    type: 'positive',
    labels: {
      min: 'None',
      max: 'Happy',
    },
  },
  {
    key: EMOTIVITY.DATABASE.FIELDS.ANGER,
    title: 'Anger',
    text: 'How angry are you today?',
    image: require('../../assets/images/angry.png'),
    type: 'negative',
    labels: {
      min: 'None',
      max: 'Furious',
    },
  },
  {
    key: EMOTIVITY.DATABASE.FIELDS.ANXIETY,
    title: 'Anxiety',
    text: 'How anxious are you today?',
    image: require('../../assets/images/anxiety.png'),
    type: 'negative',
    labels: {
      min: 'None',
      max: 'Overwhelmed',
    },
  },
  {
    key: EMOTIVITY.DATABASE.FIELDS.SADNESS,
    title: 'Sad',
    text: 'How sad are you today?',
    image: require('../../assets/images/cry.png'),
    type: 'negative',
    labels: {
      min: 'None',
      max: 'Devastated',
    },
  },
  {
    key: EMOTIVITY.DATABASE.FIELDS.STRESS,
    title: 'Stress',
    text: 'How stressed are you today?',
    image: require('../../assets/images/stress.png'),
    type: 'negative',
    labels: {
      min: 'None',
      max: 'Intense',
    },
  },
  {
    key: EMOTIVITY.DATABASE.FIELDS.TIRED,
    title: 'Tired',
    text: 'How tired are you today?',
    image: require('../../assets/images/tired.png'),
    type: 'negative',
    labels: {
      min: 'None',
      max: 'Exhausted',
    },
  },
];

let isFirstRingLegend = true;

export class EmotivityScreen extends React.Component {
  vals = {
    anger: 0,
    anxiety: 0,
    happiness: 0,
    sadness: 0,
    stress: 0,
    tired: 0,
  };

  constructor(props) {
    super(props);
    this.setSelectedIndex = this.setSelectedIndex.bind(this);
    //this.renderWithoutHeader = this.renderWithoutHeader.bind(this);
    //this.renderWithHeader = this.renderWithHeader.bind(this);
    this.renderQuestionsModal = this.renderQuestionsModal.bind(this);
    this.renderPromptModal = this.renderPromptModal.bind(this);
    this.toggleQuestionsModal = this.toggleQuestionsModal.bind(this);
    this.togglePromptModal = this.togglePromptModal.bind(this);
    this.state = {
      anger: 0,
      anxiety: 0,
      happiness: 0,
      sadness: 0,
      stress: 0,
      tired: 0,
      done: API.emotivity.emotivityStatus,
      q1: '',
      q2: '',
      q3: '',
      diaryData: undefined,
      weeklyDiaryData: [],
      weeklyEmotivityData: {
        anger: 0,
        anxiety: 0,
        happiness: 0,
        sadness: 0,
        stress: 0,
        tired: 0,
      },
      selectedIndex: 0,
      questions_visible: false,
      prompt_visible: false,
      promptText: '',
      reflect_visible: false,
      visible: false,
      record_type: '',
      mood_string: '',
    };
  }

  async componentDidMount() {
    const user = await API.storage.getDataFromStorage<FirebaseAuthTypes.User>(StorageKeys.USER);
    this.setState({ user });
    await API.firestore.getTodayDiaryEntry(this.onSuccess, this.state.user.uid);
    await API.firestore.getEmotivtyData(
      this.state.user.uid,
      getDateWeekAgo(DATE.FORMATS.DB_UNIX),
      getDateToday(DATE.FORMATS.DB_UNIX),
      this.onSuccessMoodTracking,
      this.onSuccessDiaryEntry,
    );
    const emotivityRecord = API.emotivity.emotivityRecord;
    this.setState(emotivityRecord);
  }

  onSuccess = querySnapshot => {
    if (querySnapshot.size === 0) {
      console.warn('Found 0 diary entries for today.');
      this.setState({ diaryData: 'empty' });
    } else if (querySnapshot.size > 1) {
      console.warn('Found over 1 diary entries for today.');
      querySnapshot.forEach(documentSnapshot => {
        this.setState({ diaryData: documentSnapshot });
      });
    } else {
      querySnapshot.forEach(documentSnapshot => {
        this.setState({ diaryData: documentSnapshot });
      });
    }
  };

  onSuccessMoodTracking = querySnapshot => {
    if (querySnapshot.size === 0) {
      console.warn('Emotivity Weekly: 0 results found.');
      this.setState({ weeklyEmotivityData: 'empty' });
    } else {
      let count = 0;
      const scores = {
        [EMOTIVITY.DATABASE.FIELDS.ANGER]: 0,
        [EMOTIVITY.DATABASE.FIELDS.ANXIETY]: 0,
        [EMOTIVITY.DATABASE.FIELDS.HAPPINESS]: 0,
        [EMOTIVITY.DATABASE.FIELDS.SADNESS]: 0,
        [EMOTIVITY.DATABASE.FIELDS.STRESS]: 0,
        [EMOTIVITY.DATABASE.FIELDS.TIRED]: 0,
      };

      querySnapshot.forEach(documentSnapshot => {
        count++;
        scores[EMOTIVITY.DATABASE.FIELDS.ANGER] =
          scores[EMOTIVITY.DATABASE.FIELDS.ANGER] +
          parseInt(documentSnapshot.data()[EMOTIVITY.DATABASE.FIELDS.ANGER]);
        scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY] =
          scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY] +
          parseInt(documentSnapshot.data()[EMOTIVITY.DATABASE.FIELDS.ANXIETY]);
        scores[EMOTIVITY.DATABASE.FIELDS.HAPPINESS] =
          scores[EMOTIVITY.DATABASE.FIELDS.HAPPINESS] +
          parseInt(
            documentSnapshot.data()[EMOTIVITY.DATABASE.FIELDS.HAPPINESS],
          );
        scores[EMOTIVITY.DATABASE.FIELDS.SADNESS] =
          scores[EMOTIVITY.DATABASE.FIELDS.SADNESS] +
          parseInt(documentSnapshot.data()[EMOTIVITY.DATABASE.FIELDS.SADNESS]);
        scores[EMOTIVITY.DATABASE.FIELDS.STRESS] =
          scores[EMOTIVITY.DATABASE.FIELDS.STRESS] +
          parseInt(documentSnapshot.data()[EMOTIVITY.DATABASE.FIELDS.STRESS]);
        scores[EMOTIVITY.DATABASE.FIELDS.TIRED] =
          scores[EMOTIVITY.DATABASE.FIELDS.TIRED] +
          parseInt(documentSnapshot.data()[EMOTIVITY.DATABASE.FIELDS.TIRED]);
      });

      scores[EMOTIVITY.DATABASE.FIELDS.ANGER] =
        scores[EMOTIVITY.DATABASE.FIELDS.ANGER] / count;
      scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY] =
        scores[EMOTIVITY.DATABASE.FIELDS.ANXIETY] / count;
      scores[EMOTIVITY.DATABASE.FIELDS.HAPPINESS] =
        scores[EMOTIVITY.DATABASE.FIELDS.HAPPINESS] / count;
      scores[EMOTIVITY.DATABASE.FIELDS.SADNESS] =
        scores[EMOTIVITY.DATABASE.FIELDS.SADNESS] / count;
      scores[EMOTIVITY.DATABASE.FIELDS.STRESS] =
        scores[EMOTIVITY.DATABASE.FIELDS.STRESS] / count;
      scores[EMOTIVITY.DATABASE.FIELDS.TIRED] =
        scores[EMOTIVITY.DATABASE.FIELDS.TIRED] / count;

      this.setState({ weeklyEmotivityData: scores });
    }
  };

  onSuccessDiaryEntry = querySnapshot => {
    const entries: Object[] = [];
    querySnapshot.forEach(documentSnapshot => {
      console.log(documentSnapshot.data());
      entries.push(documentSnapshot);
    });
    this.setState({ weeklyDiaryData: entries });
  };

  renderDrawerAction = (): React.ReactElement => (
    <TopNavigationAction
      icon={MenuIcon}
      onPress={this.props.navigation.toggleDrawer}
    />
  );

  _renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <ArrowIosForwardIcon
          fill={'rgba(255, 255, 255, .9)'}
          style={{ backgroundColor: 'transparent' }}
        />
      </View>
    );
  };

  _renderPrevButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <ArrowIosBackIcon
          fill={'rgba(255, 255, 255, .9)'}
          style={{ backgroundColor: 'transparent' }}
        />
      </View>
    );
  };

  _renderDoneButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <CheckIcon style={{ backgroundColor: 'transparent' }} />
      </View>
    );
  };

  onChange = (key, value) => {
    this.vals[key] = value;
  };

  onDrop = key => {
    this.setState(this.vals);
  };

  emotivitySlide = ({ item }) => {
    return (
      <View
        style={item.type === 'positive' ? styles.pos_slide : styles.neg_slide}>
        <Text style={styles.title}>{item.title}</Text>
        <Image
          style={[
            this.state[item.key] == 0
              ? { transform: [{ scale: 0.5 }] }
              : {
                transform: [
                  { scale: parseInt(this.state[item.key]) * 0.15 + 0.5 },
                ],
              },
            styles.icon,
          ]}
          source={item.image}
        />
        <Text style={styles.text}>{item.text}</Text>
        <MotionSlider
          min={0}
          max={5}
          value={this.state[item.key]}
          height={60}
          decimalPlaces={0}
          fontSize={14}
          backgroundColor={item.type === 'positive' ? ['#5A1866'] : ['#5A1866']}
          onValueChanged={value => this.onChange(item.key, value)}
          onPressOut={() => this.onDrop(item.key)}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '68%',
          }}>
          <Text style={[styles.hint, { textAlign: 'left' }]}>
            {item.labels.min}
          </Text>
          <Text style={[styles.hint, { textAlign: 'right' }]}>
            {item.labels.max}
          </Text>
        </View>
        <Layout style={styles.margin} />
      </View>
    );
  };

  onMoodScoreSubmit = async () => {
    // Get all the negatives that are >= 3

    const moods: String[] = [];
    if (this.state.anger > 2) {
      moods.push('Anger');
    }
    if (this.state.anxiety > 2) {
      moods.push('Anxiety');
    }
    if (this.state.sadness > 2) {
      moods.push('Sadness');
    }
    if (this.state.stress > 2) {
      moods.push('Stress');
    }
    if (this.state.tired > 2) {
      moods.push('Tired');
    }

    // Generate the modal based on the negatives >= 3

    if (moods.length === 0) {
      this.setState({
        record_type: 'positive',
      });
    } else if (moods.length === 1) {
      this.setState({
        record_type: 'negative',
        mood_string: moods[0],
      });
    } else {
      this.setState({
        record_type: 'negative',
        mood_string: [moods.slice(0, -1).join(', '), moods.slice(-1)[0]].join(
          moods.length < 2 ? '' : ' and ',
        ),
      });
    }

    this.togglePromptModal();

    const emotivity: EmotivityRecord = {
      anger: this.state.anger,
      anxiety: this.state.anxiety,
      happiness: this.state.happiness,
      sadness: this.state.sadness,
      stress: this.state.stress,
      tired: this.state.tired,
    }
    await API.firestore.adMoodTrackingRecord(emotivity, this.state.user.uid);
  };

  renderPromptModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
        🙌 Thank You!
      </Text>
      {this.state.record_type === 'positive' && (
        <Text style={{ textAlign: 'justify' }}>
          Seems like you've had a good day 😄. That's great to hear! Would you
          like to make a note on today's events and reflect on them?
        </Text>
      )}
      {this.state.record_type === 'negative' && (
        <Text style={{ textAlign: 'justify' }}>
          We noticed that you have felt a noticable amount of
          <Text style={{ color: '#712177', fontWeight: 'bold' }}>
            {' '}
            {this.state.mood_string}{' '}
          </Text>
          today. We believe that making a note about the events and reflecting
          on them can actually help. Would you like to make a new diary entry?
        </Text>
      )}
      {/*<Input placeholder='Location:'/>
      <Input placeholder='What happened:'/>
      <Input placeholder='Your thoughts at the time:'/>*/}
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
          onPress={this.proceedButton}>
          Yes
        </Button>
        <Button
          style={[styles.buttonHalf]}
          status="warning"
          onPress={this.togglePromptModal}>
          Skip
        </Button>
      </View>
    </Layout>
  );

  setSelectedIndex = index => {
    this.setState({ selectedIndex: index });
  };

  toggleTooltip = () => {
    this.setState({ visible: !this.state.visible });
  };

  renderIcon = style => (
    <FontAwesomeIcon size={20} color={'black'} icon={faInfoCircle} />
  );

  renderQuestionsModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <View style={{ flexDirection: 'row' }}>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>
      📝 New Diary Entry
      </Text>
      <Input
      style={styles.input}
      textStyle={styles.inputText}
      labelStyle={styles.label}
      label="What happened:"
      placeholder="I felt very anxious"
      onChangeText={t => this.setState({q1: t})}
      value={this.state.q1}
      />
      <Input
      style={styles.input}
      textStyle={styles.inputText}
      labelStyle={styles.label}
      label="Location:"
      placeholder="At home"
      onChangeText={t => this.setState({q2: t})}
      value={this.state.q2}
      />
      <Input
      style={styles.input}
      textStyle={styles.inputText}
      labelStyle={styles.label}
      label="Your thoughts at the time:"
      placeholder="My thesis submission is due next week and i don't think that i would be able to finish it on time."
      multiline={true}
      numberOfLines={3}
      onChangeText={t => this.setState({q3: t})}
      value={this.state.q3}
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
      onPress={this.reflectNowButton}>
      Reflect Now
      </Button>
      <Button
      style={[styles.buttonHalf]}
      status="primary"
      onPress={this.reflectLaterButton}>
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
      onPress={this.diarySkipButton}>
      Skip
      </Button>
      </View>
    </Layout>
  );

  renderReflectModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <View style={{ flexDirection: 'row' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
          🤔 Today's Reflection
        </Text>
      </View>

      <Text style={{ textAlign: 'justify', marginBottom: 8 }}>
        Explain the role of the diary entry briefly. about reclecting etc.
      </Text>
      <Input
        style={styles.input}
        textStyle={styles.inputText}
        labelStyle={styles.label}
        label="Your thoughts and how you felt after reflecting:"
        placeholder="Insert a good reflection text here."
        multiline={true}
        size="small"
        numberOfLines={5}
        onChangeText={t => this.setState({ q4: t })}
        value={this.state.q4}
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
          onPress={this.reflectSubmitButton}>
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
          onPress={this.backButton}>
          Back
        </Button>
        <Button
          style={[styles.buttonHalf]}
          status={'warning'}
          onPress={this.laterButton}>
          Reflect Later
        </Button>
      </View>
    </Layout>
  );

  _sendAddDiaryRequest = async () => {
    const convos: Object[] = [];
    if (this.state.q1) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q1,
        },
        answer: {
          text: this.state.q1,
          time: Date.now(),
        },
      });
    }
    if (this.state.q2) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q2,
        },
        answer: {
          text: this.state.q2,
          time: Date.now(),
        },
      });
    }
    if (this.state.q3) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q3,
        },
        answer: {
          text: this.state.q3,
          time: Date.now(),
        },
      });
    }

    const entryDoc: DiaryEntryDoc = {
      user: this.state.user.uid,
      conversations: convos as Conversation[],
      status: 'Incomplete',
      date: getDateToday('')
    }

    await API.firestore.addNewDiaryEntry(entryDoc);
  };

  _sendReflectRequest = (id) => {
    API.firestore.addReflection(id, {
      question: { text: DIARY.DATABASE.QUESTIONS.Q4 },
      answer: { text: this.state.q4, time: Date.now() }
    }
    );
  }

  reflectSubmitButton = async () => {
    const convos: Object[] = [];
    if (this.state.q1) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q1,
        },
        answer: {
          text: this.state.q1,
          time: Date.now(),
        },
      });
    }
    if (this.state.q2) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q2,
        },
        answer: {
          text: this.state.q2,
          time: Date.now(),
        },
      });
    }
    if (this.state.q3) {
      convos.push({
        question: {
          text: DIARY.DATABASE.QUESTIONS.Q3,
        },
        answer: {
          text: this.state.q3,
          time: Date.now(),
        },
      });
    }
    const entryDoc: DiaryEntryDoc = {
      user: this.state.user.uid,
      conversations: [
        ...(convos as Conversation[]),
        {
          question: {
            text: DIARY.DATABASE.QUESTIONS.Q4,
          },
          answer: {
            text: this.state.q4,
            time: Date.now(),
          },
        },
      ],
      status: 'Complete',
      date: getDateToday('')
    }
    await API.firestore.addNewDiaryEntry(entryDoc)
    await API.firestore.getTodayDiaryEntry(this.onSuccess, this.state.user.uid);
    this.setState({ reflect_visible: !this.state.reflect_visible });
  };

  toggleQuestionsModal = () => {
    this.setState({
      prompt_visible: !this.state.prompt_visible,
      questions_visible: !this.state.questions_visible,
    });
  };

  proceedButton = () => {
    this.setState({
      prompt_visible: !this.state.prompt_visible,
      questions_visible: !this.state.questions_visible,
    });
  };

  reflectNowButton = () => {
    this.setState({ reflect_visible: true, questions_visible: false });
  };

  laterButton = () => {
    if (this.state.user) {
      this._sendAddDiaryRequest();
      API.firestore.getTodayDiaryEntry(this.onSuccess, this.state.user.uid);
      this.setState({ reflect_visible: false });
    }
  };

  backButton = () => {
    this.setState({ reflect_visible: false, questions_visible: true });
  };

  reflectLaterButton = () => {
    if (this.state.user) {
      this._sendAddDiaryRequest();
      API.firestore.getTodayDiaryEntry(this.onSuccess, this.state.user.uid);
      this.setState({ questions_visible: false });
    }
  };

  diarySkipButton = () => {
    this.setState({ questions_visible: false });
  };

  togglePromptModal = () => {
    this.setState({ done: true, prompt_visible: !this.state.prompt_visible });
  };

  render() {
    if (this.state.done) {
      return (
        <SafeAreaLayout style={styles.safeArea} insets="top">
          <TopNavigation
            title="eMotivity"
            leftControl={this.renderDrawerAction()}
          />
          <Divider />
          <TabView
            style={styles.tabView}
            tabBarStyle={styles.bar}
            indicatorStyle={styles.tabViewIndicator}
            selectedIndex={this.state.selectedIndex}
            onSelect={this.setSelectedIndex}>
            <Tab
              titleStyle={
                this.state.selectedIndex === 0
                  ? styles.active_title
                  : styles.inactive_title
              }
              title="Today">
              <ScrollView
                style={{
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
                  {UtilService.getDateToday()}
                </Text>
                <Divider
                  style={{
                    width: '100%',
                    alignSelf: 'center',
                    marginVertical: 10,
                  }}
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
                      'Sad -',
                      'Stress -',
                      'Tired -',
                      'Happy -',
                    ],
                    data: [
                      this.state.anger / 5,
                      this.state.anxiety / 5,
                      this.state.sadness / 5,
                      this.state.stress / 5,
                      this.state.tired / 5,
                      this.state.happiness / 5,
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
                      } else if (
                        opacity === 1 ||
                        opacity === 0.8333333333333333
                      ) {
                        //5th Ring - Tired
                        //return '#712177'
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
                      } else if (
                        opacity === 0.4 ||
                        opacity === 0.5833333333333334
                      ) {
                        // 2nd Ring - Anxiety
                        if (opacity === 0.5833333333333334) {
                          isFirstRingLegend = true;
                        }
                        return '#57B4E9';
                      } else if (opacity === 0.2) {
                        // 1st Ring Legend
                        //return 'grey';
                        if (isFirstRingLegend) {
                          isFirstRingLegend = false;
                          return '#0172B2';
                        } else {
                          return 'rgba(113, 33, 119, 0.2)';
                        }
                      } else if (opacity === 0.5) {
                        // 1st Ring - Anger
                        //return '#ED0345'
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
              </ScrollView>
            </Tab>
            <Tab
              titleStyle={
                this.state.selectedIndex === 1
                  ? styles.active_title
                  : styles.inactive_title
              }
              title="Week">
              <ScrollView
                style={{
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
                  {moment()
                    .subtract(6, 'days')
                    .format('Do MMMM YYYY') +
                    ' to ' +
                    moment().format('Do MMMM YYYY')}
                </Text>
                <Divider
                  style={{
                    width: '100%',
                    alignSelf: 'center',
                    marginVertical: 10,
                  }}
                />
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 20,
                    marginTop: 10,
                    textAlign: 'center',
                  }}>
                  Average Mood Summary
                </Text>
                <Divider style={styles.divider} />
                {/*<Text style={{fontWeight: 'bold', fontSize: 20, marginBottom: 16, textAlign: 'center'}}>Your Mood</Text>*/}
                <ProgressChart
                  data={{
                    labels: [
                      'Anger -',
                      'Anxiety -',
                      'Sad -',
                      'Stress -',
                      'Tired -',
                      'Happy -',
                    ],
                    data:
                      this.state.weeklyEmotivityData &&
                        this.state.weeklyEmotivityData !== 'empty'
                        ? [
                          this.state.weeklyEmotivityData.anger / 5,
                          this.state.weeklyEmotivityData.anxiety / 5,
                          this.state.weeklyEmotivityData.sadness / 5,
                          this.state.weeklyEmotivityData.stress / 5,
                          this.state.weeklyEmotivityData.tired / 5,
                          this.state.weeklyEmotivityData.happiness / 5,
                        ]
                        : [0, 0, 0, 0, 0, 0],
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
                      } else if (
                        opacity === 1 ||
                        opacity === 0.8333333333333333
                      ) {
                        //5th Ring - Tired
                        //return '#712177'
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
                      } else if (
                        opacity === 0.4 ||
                        opacity === 0.5833333333333334
                      ) {
                        // 2nd Ring - Anxiety
                        if (opacity === 0.5833333333333334) {
                          isFirstRingLegend = true;
                        }
                        return '#57B4E9';
                      } else if (opacity === 0.2) {
                        // 1st Ring Legend
                        //return 'grey';
                        if (isFirstRingLegend) {
                          isFirstRingLegend = false;
                          return '#0172B2';
                        } else {
                          return 'rgba(113, 33, 119, 0.2)';
                        }
                      } else if (opacity === 0.5) {
                        // 1st Ring - Anger
                        //return '#ED0345'
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
                <Divider style={styles.divider} />
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 20,
                    marginBottom: 16,
                    textAlign: 'center',
                  }}>
                  Diary Entries
                </Text>
                <View style={{ marginBottom: screenHeight / 3.5 }}>
                  {this.state.weeklyDiaryData.map(entry => (
                    <DiaryEntry entry={entry} />
                  ))}
                </View>
              </ScrollView>
            </Tab>
            <Tab
              titleStyle={
                this.state.selectedIndex === 2
                  ? styles.active_title
                  : styles.inactive_title
              }
              title="Custom">
              <ScrollView
                style={{
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
                  Date 1 to Date 2
                </Text>
                <Divider
                  style={{
                    width: '100%',
                    alignSelf: 'center',
                    marginVertical: 10,
                  }}
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
              </ScrollView>
            </Tab>
          </TabView>
        </SafeAreaLayout>
      );
    } else {
      return (
        <SafeAreaLayout style={styles.safeArea} insets="top">
          <TopNavigation
            title="eMotivity"
            leftControl={this.renderDrawerAction()}
          />
          <Divider />
          <AppIntroSlider
            slides={moods}
            renderItem={this.emotivitySlide}
            showPrevButton={true}
            scrollEnabled={false}
            renderNextButton={this._renderNextButton}
            renderPrevButton={this._renderPrevButton}
            renderDoneButton={this._renderDoneButton}
            extraData={this.state}
            onDone={this.onMoodScoreSubmit}
          />
        </SafeAreaLayout>
      );
    }
  }
}

const styles = StyleSheet.create({
  input: {
    //height: 80
    marginTop: 8,
  },
  inputText: {
    paddingTop: 2,
    textAlignVertical: 'top',
  },
  label: {
    color: 'black',
    fontSize: 14,
    //fontWeight: 'bold'
  },
  safeArea: {
    flex: 1,
  },
  icon: {
    width: '30%',
    height: '30%',
    resizeMode: 'contain',
    paddingVertical: '15%',
  },
  slider: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  neg_slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    //backgroundColor: '#E35B5F'
    //backgroundColor: '#FF6663'
    backgroundColor: '#712177',
  },
  pos_slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    //backgroundColor: '#50C349'
    //backgroundColor: '#5CB85C'
    backgroundColor: '#712177',
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
  state: {
    color: 'rgba(255, 255, 255, 1)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingBottom: 0,
    paddingTop: 24,
    fontWeight: 'bold',
    fontSize: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingTop: 16,
    marginBottom: 16,
  },
  hint: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    //textAlign: 'right',
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
  active_title: {
    color: '#712177',
    fontWeight: 'bold',
  },
  inactive_title: {
    fontWeight: 'bold',
  },
  bar: {
    height: 40,
  },
  tabView: {},
  tabViewIndicator: {
    backgroundColor: '#712177',
    borderRadius: 0,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    padding: 16,
    borderRadius: 5,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  readButtonFull: {
    backgroundColor: '#712177',
    borderColor: '#712177',
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
  divider: {
    width: '50%',
    backgroundColor: '#ddd',
    alignSelf: 'center',
    height: 1,
    marginVertical: 16,
    borderRadius: 5,
  },
});
