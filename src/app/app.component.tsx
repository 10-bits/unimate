import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import {ApplicationProvider, IconRegistry} from '@ui-kitten/components';
import {EvaIconsPack} from '@ui-kitten/eva-icons';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import {AppearanceProvider} from 'react-native-appearance';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {API} from '../refactored-services';
import {EmotivityRecord} from '../refactored-services/emotivity.service';
import {StorageKeys} from '../refactored-services/storage.service';
import {Logger} from '../utils/logger';
import {SplashImage} from '../components/splash-image.component';
import {StatusBar} from '../components/status-bar.component';
import {AppNavigator} from '../navigation/app.navigator';
import LoginScreen from '../screens/login/login.component';
import {FirebaseService} from '../services/firebase.service';
import {Mapping, Theme, Theming} from '../services/theme.service';
import {useMapping, useTheming} from '../utils/theme';
import {AppIconsPack} from './app-icons-pack';
import {AppLoading, Task} from './app-loading.component';
import {default as appTheme} from './app-theme.json';
import {appMappings, appThemes} from './app-theming';

const loadingTasks: Task[] = [];

const defaultConfig: {mapping: Mapping; theme: Theme} = {
  mapping: 'eva',
  theme: 'light',
};

const screens = [
  {
    key: 1,
    title: 'Unimate',
    text:
      'Unimate is a research study, aimed at enhancing students’ educational experience and wellbeing.',
    image: require('../assets/images/slides/logo.png'),
    backgroundColor: '#FFFFFF', //#712177
  },
  {
    key: 2,
    title: 'What Unimate Does',
    text:
      'Unimate can help you to be aware and take control of your mental and physical health.',
    image: require('../assets/images/slides/happiness.png'),
    backgroundColor: '#FFFFFF',
  },
  {
    key: 3,
    title: 'Your Privacy Matters',
    text:
      "Don't worry! All your details are anonymised. Even we, won't be able to trace them back to you!",
    image: require('../assets/images/slides/privacy-shield.png'),
    backgroundColor: '#FFFFFF',
  },
  {
    key: 4,
    title: 'Emotivity',
    text:
      'We want to help you take control of your health by monitoring and changing your emotional and physical reactions.',
    image: require('../assets/images/slides/reaction.png'),
    backgroundColor: '#FFFFFF',
  },
  {
    key: 5,
    title: 'Daily Tasks',
    text:
      'Keep up with your daily tasks and they will definitely help you when it comes to enhancing your mental health.',
    image: require('../assets/images/slides/todo.png'),
    backgroundColor: '#FFFFFF',
  },
  {
    key: 6,
    title: 'SayThanx &\n ShowGratitude',
    text:
      'We can help you to be happier by letting you be thankful, everyday! \nYou can also keep track of what you are grateful to and reflect on them at your own pace!',
    image: require('../assets/images/slides/thanks.png'),
    backgroundColor: '#FFFFFF',
  },
  {
    key: 7,
    title: 'Traxivity',
    text: 'Lift up your mood by keeping up with your workout goals.',
    image: require('../assets/images/slides/steps.png'),
    backgroundColor: '#FFFFFF',
  },
  {
    key: 8,
    title: 'Start!',
    text: 'Let’s Start!',
    image: require('../assets/images/slides/start.png'),
    backgroundColor: '#FFFFFF',
  },
];

const _renderItem = ({item}) => {
  return (
    <View
      style={{
        ...styles.renderItemContainer,
        backgroundColor: item.backgroundColor,
      }}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
      <View style={styles.margin} />
    </View>
  );
};

const _renderNextButton = () => {
  return (
    <View style={styles.buttonNext}>
      <Text style={styles.buttonNextText}>Next</Text>
    </View>
  );
};
const _renderDoneButton = () => {
  return (
    <View style={styles.buttonDone}>
      <Text style={styles.buttonDoneText}>Done</Text>
    </View>
  );
};
const _renderPrevButton = () => {
  return (
    <View style={styles.buttonPrev}>
      <Text style={styles.buttonPrevText}>Back</Text>
    </View>
  );
};

const App = ({mapping, theme}): React.ReactElement => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User>();
  const [, setEmotivityDone] = useState<boolean>(false);
  const [, setTraxivityDone] = useState<boolean>(false);
  const [isFirst, setIsFirst] = useState<boolean | null>(null);

  const [mappingContext, currentMapping] = useMapping(appMappings, mapping);
  const [themeContext, currentTheme] = useTheming(appThemes, mapping, theme);

  const finalTheme = {...currentTheme, ...appTheme};

  const _onDone = useCallback(async () => {
    await API.storage.saveToStorage(StorageKeys.HAS_LAUNCHED, false);
    setIsFirst(false);
  }, []);

  const hasLaunchedBefore = useCallback(async () => {
    const hasLaunched = await API.storage.getDataFromStorage<boolean>(
      StorageKeys.HAS_LAUNCHED,
    );
    setIsFirst(hasLaunched);
  }, []);

  const checkPushPermissions = async () => {
    const enabled = await messaging().hasPermission();
    if (enabled) {
      getToken();
    } else {
      requestPermission();
    }
  };

  const getToken = async () => {
    const token = await messaging().getToken();
    FirebaseService.setPushToken(token);
  };

  const requestPermission = async () => {
    try {
      await messaging().requestPermission();
      getToken();
    } catch (error) {
      console.log('Rejected');
    }
  };

  const createNotificationListeners = async () => {
    // If your app is in Foreground
    notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        const localNotification = new firebase.notifications.Notification({
          show_in_foreground: true,
        })
          .setNotificationId(notification.notificationId)
          .setTitle(notification.title)
          .setBody(notification.body);

        firebase
          .notifications()
          .displayNotification(localNotification)
          .catch(err => console.error(err));
      });

    //If your app is in background
    notificationOpenedListener = firebase
      .notifications()
      .onNotificationOpened(notificationOpen => {
        const {title, body} = notificationOpen.notification;
        console.log('onNotificationOpened:');
        Alert.alert(title, body);
      });

    // If your app is closed

    const notificationOpen = await firebase
      .notifications()
      .getInitialNotification();
    if (notificationOpen) {
      console.log('getInitialNotification:');
    }

    // For data only payload in foreground

    messaging().onMessage(message => {
      //process data message
      console.log('Message', JSON.stringify(message));
    });
  };

  const onSuccessEmotivitySubscription = useCallback(
    (data: FirebaseFirestoreTypes.QuerySnapshot) => {
      if (data.size === 0) {
        Logger.warn('Found 0 emotivity records for today.');
        API.emotivity.setEmotivityDetails(false);
      } else if (data.size > 1) {
        Logger.warn('Found over 1 emotivity records for today.');
        data.forEach(snapshot => {
          setEmotivityDone(true);
          return API.emotivity.setEmotivityDetails(
            true,
            snapshot.data() as EmotivityRecord,
          );
        });
      } else {
        data.forEach(snapshot => {
          setEmotivityDone(true);
          return API.emotivity.setEmotivityDetails(
            true,
            snapshot.data() as EmotivityRecord,
          );
        });
      }
    },
    [],
  );

  const onSuccessTraxivitySubscription = useCallback(
    (snap: FirebaseFirestoreTypes.DocumentSnapshot) => {
      if (snap.exists && snap.data()) {
        API.traxivity.getSteptsToday(
          (snap.data() as {dailyStepGoal: number}).dailyStepGoal,
          () => setTraxivityDone(true),
        );
      } else {
        API.traxivity.getSteptsToday(5000, () => setTraxivityDone(true));
      }
    },
    [],
  );

  useEffect(() => {
    let emotivitySubscription;
    let traxivitySubscription;
    let authSubscription;
    (async () => {
      await hasLaunchedBefore();
      await createNotificationListeners();

      authSubscription = auth().onAuthStateChanged(async firebaseUser => {
        if (firebaseUser) {
          await API.firestore.storeUserInFirestore(firebaseUser);
          await API.storage.saveToStorage(StorageKeys.USER, firebaseUser);
          setUser(firebaseUser);
          await checkPushPermissions();

          if (initializing) {
            setInitializing(false);
          }

          emotivitySubscription = await API.firestore.subscribeForEmotivity(
            firebaseUser.uid,
            onSuccessEmotivitySubscription,
          );
          traxivitySubscription = await API.firestore.subscribeForTraxivity(
            firebaseUser.uid,
            onSuccessTraxivitySubscription,
          );
        }
      });
    })();

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    const foreground = messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return () => {
      authSubscription.unsubscribe();
      emotivitySubscription;
      traxivitySubscription;
      foreground();
    };
  }, [
    hasLaunchedBefore,
    initializing,
    onSuccessEmotivitySubscription,
    onSuccessTraxivitySubscription,
  ]);

  if (isFirst === null) {
    return (
      <View style={[styles.container, styles.horizontal]}>
        <ActivityIndicator size="large" color="#712177" />
      </View>
    );
  }

  if (isFirst) {
    return (
      <AppIntroSlider
        slides={screens}
        renderItem={_renderItem}
        renderDoneButton={_renderDoneButton}
        renderNextButton={_renderNextButton}
        renderPrevButton={_renderPrevButton}
        showPrevButton={true}
        activeDotStyle={{backgroundColor: '#712177'}}
        // dotStyle={{backgroundColor: '#F8D4EE'}}
        onDone={_onDone}
      />
    );
  }

  if (!user) {
    return (
      <React.Fragment>
        <IconRegistry icons={[EvaIconsPack, AppIconsPack]} />
        {/*initializing &&
        <View style={[styles.container, styles.horizontal]}>
          <ActivityIndicator size="large" color="#712177" />
        </View>
        */}

        <AppearanceProvider>
          <ApplicationProvider {...currentMapping} theme={finalTheme}>
            <Theming.MappingContext.Provider value={mappingContext}>
              <Theming.ThemeContext.Provider value={themeContext}>
                <SafeAreaProvider>
                  <StatusBar />
                  <View>
                    <LoginScreen />
                  </View>
                </SafeAreaProvider>
              </Theming.ThemeContext.Provider>
            </Theming.MappingContext.Provider>
          </ApplicationProvider>
        </AppearanceProvider>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <IconRegistry icons={[EvaIconsPack, AppIconsPack]} />
      {initializing && (
        <View style={[styles.container, styles.horizontal]}>
          <ActivityIndicator size="large" color="#712177" />
        </View>
      )}
      {!initializing && (
        <AppearanceProvider>
          <ApplicationProvider {...currentMapping} theme={finalTheme}>
            <Theming.MappingContext.Provider value={mappingContext}>
              <Theming.ThemeContext.Provider value={themeContext}>
                <SafeAreaProvider>
                  <StatusBar />
                  <AppNavigator />
                </SafeAreaProvider>
              </Theming.ThemeContext.Provider>
            </Theming.MappingContext.Provider>
          </ApplicationProvider>
        </AppearanceProvider>
      )}
    </React.Fragment>
  );
};

const Splash = ({loading}): React.ReactElement => (
  <SplashImage
    loading={loading}
    source={require('../assets/images/image-splash.png')}
  />
);

export default (): React.ReactElement => (
  <AppLoading
    tasks={loadingTasks}
    initialConfig={defaultConfig}
    placeholder={Splash}>
    {props => <App {...props} />}
  </AppLoading>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
  },
  image: {
    //width: '88%',
    height: '25%',
    marginVertical: '6%',
    resizeMode: 'contain',
    // padding: '30%'
  },
  text: {
    color: '#7D7C7C',
    textAlign: 'center',
    fontSize: 16,
    //fontWeight: 'bold',
    paddingTop: 30,
    marginBottom: '24%',
    marginHorizontal: 20,
  },
  title: {
    paddingTop: 24,
    fontSize: 22,
    color: 'black',
    textAlign: 'center',
  },
  margin: {
    //height: '15%'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  buttonNextText: {
    color: '#712177',
  },
  buttonNext: {
    marginRight: '8%',
  },
  buttonDoneText: {
    color: '#712177',
  },
  buttonDone: {
    marginRight: '8%',
  },
  buttonPrev: {
    marginLeft: '25%',
  },
  buttonPrevText: {
    color: '#7F8283',
  },
  renderItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
