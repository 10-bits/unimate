import {
  faHandHoldingHeart,
  faSmile,
  faWalking,
} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {
  Icon,
  Text,
  TopNavigation,
  TopNavigationAction,
} from '@ui-kitten/components';
import React, {useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';
import {API} from '../../refactored-services';
import {StorageKeys} from '../../refactored-services/storage.service';
import {getDateTodayNoFormat, getUserGreeting} from '../../utils/date';
import {ActionCard} from '../../components/action-card.component';
import {InfoIcon, MenuIcon} from '../../components/icons';
import {SafeAreaLayout} from '../../components/safe-area-layout.component';
import {TodoInput} from '../../components/todo-input.component';
import {TodoItem} from '../../components/todo-item.component';

export const MoodScreen = ({navigation}): React.ReactElement => {
  const [actionData, setActionData] = React.useState<Object>();
  const [todoItems, setTodoItems] = React.useState([]);
  const [emotivityCompleted, setEmotivityCompleted] = React.useState(0);
  const [sayThanxCompleted, setSayThanxCompleted] = React.useState(0);
  const [traxivityPercentage, setTraxivityPercentage] = React.useState(0);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  const userGreeting = useMemo(() => getUserGreeting(user), [user]);

  //let actionData = {}

  useEffect(() => {
    let unsubscribe;
    (async () => {
      const firebaseUser = await API.storage.getDataFromStorage<
        FirebaseAuthTypes.User
      >(StorageKeys.USER);
      setUser(firebaseUser);

      await API.firestore.getTodayActionCard(onSuccess);
      setInitialToDoList();

      unsubscribe = navigation.addListener('focus', async () => {
        // The screen is focused
        await setCurrentProgressInformation();
      });
    })();
    return () => unsubscribe();
  }, [navigation]);

  const setCurrentProgressInformation = async () => {
    try {
      const _traxivityPercentage = API.traxivity.getStepsPercentage();
      setTraxivityPercentage(_traxivityPercentage);

      const sayThanxDataCompleted = await API.storage.getDataFromStorage<any>(
        StorageKeys.SAYTHANX_FAILLED,
      );
      if (
        sayThanxDataCompleted != null &&
        Number(sayThanxDataCompleted.date) === Number(getDateTodayNoFormat())
      ) {
        setSayThanxCompleted(1);
      } else {
        setSayThanxCompleted(0);
      }

      const emotivityDataCompleted = await API.storage.getDataFromStorage<any>(
        StorageKeys.EMOTIVITY_FILLED,
      );
      if (
        emotivityDataCompleted != null &&
        Number(emotivityDataCompleted.date) === Number(getDateTodayNoFormat())
      ) {
        setEmotivityCompleted(1);
      } else {
        setEmotivityCompleted(0);
      }
    } catch (error) {}
  };

  const setInitialToDoList = async () => {
    const initialToDoList = await API.storage.getDataFromStorage<any>(
      StorageKeys.TODO_KEY,
    );
    if (initialToDoList !== null) {
      setTodoItems(initialToDoList);
    }
  };

  const onSuccess = querySnapshot => {
    console.log('mood');
    if (querySnapshot.size === 0) {
      console.warn('Found 0 action cards for today.');
      setActionData('empty');
    } else if (querySnapshot.size > 1) {
      console.warn('Found over 1 action cards for today.');
      querySnapshot.forEach(documentSnapshot => {
        setActionData(documentSnapshot);
      });
    } else {
      querySnapshot.forEach(documentSnapshot => {
        setActionData(documentSnapshot);
      });
    }
  };

  const renderDrawerAction = (): React.ReactElement => (
    <TopNavigationAction icon={MenuIcon} onPress={navigation.toggleDrawer} />
  );

  const renderSOS = (): React.ReactElement => (
    <TopNavigationAction
      icon={InfoIcon}
      onPress={() => navigation.navigate('Health')}
    />
  );

  /*toggleSecureEntry = () => {
    this.setState({disabled: !this.state.disabled})
  };*/

  const focusIcon = props => (
    <TouchableWithoutFeedback /*onPress={this.toggleSecureEntry}*/>
      {/*<Icon {...props} name={this.state.disabled ? 'edit-2-outline' : 'bookmark-outline'}/>*/}
      <Icon {...props} name={'bookmark-outline'} />
    </TouchableWithoutFeedback>
  );

  const statusE = props => (
    <Text status={API.emotivity.emotivityStatus ? 'success' : 'danger'}>
      {API.emotivity.emotivityStatus ? 'Completed' : 'Not Completed'}
    </Text>
  );

  const statusT = props => (
    <Text
      status={API.traxivity.goal > API.traxivity.steps ? 'danger' : 'success'}>
      {API.traxivity.steps}/{API.traxivity.goal}
    </Text>
  );

  const addTodoItemBottom = async _text => {
    const temp = await API.storage.getDataFromStorage(StorageKeys.TODO_KEY);
    if (temp != null) {
      temp.push({text: _text, completed: false});
      await API.storage.saveToStorage(StorageKeys.TODO_KEY, temp);
      setTodoItems(temp);
    } else {
      const tempIni = [{text: _text, completed: false}];
      await API.storage.saveToStorage(StorageKeys.TODO_KEY, tempIni);
      setTodoItems(tempIni);
    }
  };

  const addTodoItemTop = async _text => {
    const temp = await API.storage.getDataFromStorage(StorageKeys.TODO_KEY);
    if (temp != null && temp.length > 0) {
      const userInput = [{text: _text, completed: false}];
      const updatedArr = userInput.concat(temp);
      await API.storage.saveToStorage(StorageKeys.TODO_KEY, updatedArr);
      setTodoItems(updatedArr);
    } else {
      const tempIni = [{text: _text, completed: false}];
      await API.storage.saveToStorage(StorageKeys.TODO_KEY, tempIni);
      setTodoItems(tempIni);
    }
  };

  const deleteTodoItem = async _index => {
    const temp = await API.storage.getDataFromStorage(StorageKeys.TODO_KEY);
    let tempArr = [...temp];
    tempArr.splice(_index, 1);
    await API.storage.saveToStorage(StorageKeys.TODO_KEY, tempArr);
    setTodoItems(tempArr);
  };

  const completeTodoItem = async _index => {
    const temp = await API.storage.getDataFromStorage(StorageKeys.TODO_KEY);
    let tempArr = [...temp];
    if (tempArr[_index].completed) {
      const task = tempArr[_index].text;
      tempArr.splice(_index, 1);
      const userInput = [{text: task, completed: false}];
      const updatedArr = userInput.concat(tempArr);
      await API.storage.saveToStorage(StorageKeys.TODO_KEY, updatedArr);
      setTodoItems(updatedArr);
    } else {
      const task = tempArr[_index].text;
      tempArr.splice(_index, 1);
      tempArr.push({text: task, completed: true});
      await API.storage.saveToStorage(StorageKeys.TODO_KEY, tempArr);
      setTodoItems(tempArr);
    }
  };

  return (
    <SafeAreaLayout style={styles.safeArea} insets="top">
      <TopNavigation
        title="Unimate"
        leftControl={renderDrawerAction()}
        rightControls={[renderSOS()]}
        titleStyle={{color: 'white'}}
        style={{backgroundColor: '#712177'}}
      />
      {/* <Divider /> */}
      {/*<ImageBackground
            style={styles.image}
            source={require('../../assets/images/cover.png')}
      />*/}
      <ScrollView
        style={{
          backgroundColor: 'white',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}>
        <Text
          style={{
            textAlign: 'center',
            marginTop: 8,
            fontWeight: 'bold',
            fontSize: 20,
          }}
          category={'h5'}>
          {userGreeting}
        </Text>
        {/* <Text
          style={{
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 2,
            fontWeight: 'bold',
          }}>
          {' '}
          To Do Today
        </Text> */}

        <StatusBar barStyle={'light-content'} backgroundColor={'#212121'} />
        <View
          style={{
            height: 170,
            marginHorizontal: 16,
            justifyContent: 'space-between',
            flex: 1,
            borderRadius: 5,
            borderColor: '#DDD',
            borderWidth: 1,
          }}>
          <ScrollView>
            <SafeAreaView
              style={{
                marginHorizontal: 8,
                marginVertical: 8,
                justifyContent: 'space-between',
                flex: 1,
              }}>
              {(todoItems == null || todoItems.length == 0) && (
                <Text appearance="hint" style={{textAlign: 'center'}}>
                  Empty List! You have no pending tasks or completed tasks at
                  this moment
                </Text>
              )}
              <FlatList
                data={todoItems}
                // data={AppStorage.getToDoList()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({item, index}) => {
                  return (
                    <TodoItem
                      item={item}
                      deleteFunction={() => deleteTodoItem(index)}
                      completeFunction={() => completeTodoItem(index)}
                    />
                  );
                }}
              />
            </SafeAreaView>
          </ScrollView>
        </View>
        <SafeAreaView
          style={{padding: 16, justifyContent: 'space-between', flex: 1}}>
          <TodoInput onPress={addTodoItemTop} />
          <Text style={[{marginHorizontal: 16, fontSize: 12}]}>
            🔒 Your data will be stored only in your device
          </Text>
        </SafeAreaView>
        <View
          style={{
            // height: 150,
            paddingTop: '5%',
            paddingBottom: '5%',
            marginHorizontal: 16,
            justifyContent: 'space-between',
            flex: 1,
            borderRadius: 5,
            borderColor: '#17202A',
            // borderWidth: 1,
            marginBottom: '2%',
            backgroundColor: '#712177',
          }}>
          <View style={{flex: 1}}>
            <View style={{flex: 1, flexDirection: 'row'}}>
              <View style={styles.progressTraxivity}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    marginBottom: '2%',
                  }}>
                  Traxivity
                </Text>
                <Progress.Circle
                  style={{alignSelf: 'center'}}
                  size={60}
                  // progress = {1}
                  progress={traxivityPercentage}
                  strokeCap={'round'}
                  showsText={true}
                  thickness={8}
                  color={'#1c8eef'}
                  unfilledColor={'#FFFFFF'}
                  borderColor={'#712177'}
                  textStyle={{fontSize: 15, color: '#FFFFFF'}}
                  formatText={() => {
                    return (
                      <FontAwesomeIcon icon={faWalking} color={'#FFFFFF'} />
                    );
                  }}
                />
              </View>
              <View style={styles.progressTraxivity}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    marginBottom: '2%',
                  }}>
                  eMotivity
                </Text>
                <Progress.Circle
                  style={{alignSelf: 'center'}}
                  size={60}
                  progress={emotivityCompleted}
                  strokeCap={'round'}
                  showsText={true}
                  thickness={8}
                  color={'#1c8eef'}
                  unfilledColor={'#FFFFFF'}
                  borderColor={'#712177'}
                  textStyle={{fontSize: 15, color: '#FFFFFF'}}
                  formatText={() => {
                    return <FontAwesomeIcon icon={faSmile} color={'#FFFFFF'} />;
                  }}
                />
              </View>
              <View style={styles.progressTraxivity}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    marginBottom: '2%',
                  }}>
                  SayThanx
                </Text>
                <Progress.Circle
                  style={{alignSelf: 'center'}}
                  size={60}
                  progress={sayThanxCompleted}
                  strokeCap={'round'}
                  showsText={true}
                  thickness={8}
                  color={'#1c8eef'}
                  unfilledColor={'#FFFFFF'}
                  borderColor={'#712177'}
                  textStyle={{fontSize: 15, color: '#FFFFFF'}}
                  formatText={() => {
                    return (
                      <FontAwesomeIcon
                        icon={faHandHoldingHeart}
                        color={'#FFFFFF'}
                      />
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
        <ActionCard data={actionData} style={styles.actionCard} />
      </ScrollView>
      {/*<Button style={styles.button} status='danger'>SOS</Button>*/}
    </SafeAreaLayout>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#712177',
  },
  actionCard: {
    marginHorizontal: 16,
    marginTop: 2,
  },
  progressContainer: {
    flex: 1,
    // justifyContent: 'flex-start',
    // alignItems: 'flex-start',
    // marginTop:'2%',
    paddingLeft: '5%',
  },
  progressTraxivity: {
    flex: 1,
    // marginTop:'2%',
    // padding:'2%',
    // color:'#FFFFFF',
    // borderRadius:5,
    // borderWidth:2,
  },
  progressEmotivity: {
    flex: 1,
    marginTop: '2%',
    paddingLeft: '5%',
    backgroundColor: '#0091f7',
  },
  progressSayThanx: {
    flex: 1,
    marginTop: '2%',
    paddingLeft: '5%',
    backgroundColor: '#1C2833',
  },
  slider: {
    marginHorizontal: 20,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 50,
    position: 'absolute',
    bottom: 20,
    right: 20,
    //backgroundColor: '#712177',
    //borderColor: '#712177'
  },
  divider: {
    width: '25%',
    backgroundColor: '#ddd',
    alignSelf: 'center',
    height: 1,
    marginVertical: 8,
    borderRadius: 5,
  },
});
