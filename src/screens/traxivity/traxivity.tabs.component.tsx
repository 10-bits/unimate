import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firebase } from '@react-native-firebase/firestore';
import {
  Button, Layout, Modal, Select,
  SelectOptionType, Tab, TabBar, Text, TopNavigation,
  TopNavigationAction
} from '@ui-kitten/components';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { API } from '../../refactored-services';
import { StorageKeys } from '../../refactored-services/storage.service';
import { GoalIcon, MenuIcon } from '../../components/icons';

export const TraxivityTabs = ({navigation, state}): React.ReactElement => {
  const items: SelectOptionType[] = [];
  for (var i = 1000; i <= 50000; i += 1000) {
    items.push({text: i.toString()});
  }

  const [goal_visible, setGoalVisible] = React.useState<boolean>(false);
  console.log(API.traxivity.goal / 500);
  const [selectedOption, setSelectedOption] = React.useState(
    items[API.traxivity.goal / 1000 - 1],
  );

  const onTabSelect = (index: number): void => {
    navigation.navigate(state.routeNames[index]);
  };

  const renderDrawerAction = (): React.ReactElement => (
    <TopNavigationAction icon={MenuIcon} onPress={navigation.toggleDrawer} />
  );

  const renderBookmarkAction = (): React.ReactElement => (
    <TopNavigationAction
      icon={GoalIcon}
      onPress={() => setGoalVisible(!goal_visible)}
    />
  );

  const submit = async () => {
    const user = await API.storage.getDataFromStorage<FirebaseAuthTypes.User>(
      StorageKeys.USER,
    );
    const ref = firebase
      .firestore()
      .collection('users')
      .doc(user?.uid);
    firebase
      .firestore()
      .runTransaction(async transaction => {
        console.log(selectedOption.text);
        transaction.update(ref, {
          dailyStepGoal: parseInt(selectedOption.text, 10),
        });
        //Save Daily Steps goal locally. This data will be used in push notifications
        await API.storage.saveToStorage(StorageKeys.DAILY_STEPS_GOAL, parseInt(selectedOption.text, 10));
      })
      .then(() => {
        Alert.alert('Thank you', 'Your goal have been saved', [{text: 'OK'}]);
      })
      .catch(err => {
        Alert.alert('Oops! An error has occurred.', err + '', [{text: 'OK'}]);
      });
    setGoalVisible(false);
  };

  const close = () => {
    setGoalVisible(false);
  };

  const renderModal = () => (
    <Layout level="3" style={styles.modalContainer}>
      <View style={{flexDirection: 'row'}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>
          🏆 Daily Step Goal
        </Text>
      </View>

      <Text style={{textAlign: 'justify', marginVertical: 8}}>
        Select a new Daily Step Goal
      </Text>

      <Select
        data={items}
        selectedOption={selectedOption}
        onSelect={setSelectedOption}
        style={{width: 250}}
      />

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <Button style={[styles.buttonHalf]} status="primary" onPress={submit}>
          Set Goal
        </Button>
        <Button style={[styles.buttonHalf]} status="warning" onPress={close}>
          Close
        </Button>
      </View>
    </Layout>
  );

  return (
    <>
      <TopNavigation
        title="Traxivity"
        leftControl={renderDrawerAction()}
        rightControls={[renderBookmarkAction()]}
        titleStyle={{color: 'white'}}
        style={{backgroundColor: '#712177'}}
      />
      {/* <Divider/> */}
      <TabBar
        style={styles.bar}
        /*tabBarStyle={styles.bar}*/
        indicatorStyle={styles.indicator}
        selectedIndex={state.index}
        onSelect={onTabSelect}>
        <Tab style={styles.tabToday} titleStyle={styles.title} title="Today" />
        <Tab style={styles.tabWeek} titleStyle={styles.title} title="Week" />
        <Tab style={styles.tabMonth} titleStyle={styles.title} title="Month" />
      </TabBar>
      <Modal backdropStyle={styles.backdrop} visible={goal_visible}>
        {renderModal()}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  indicator: {
    borderRadius: 0,
  },
  bar: {
    height: 50,
    backgroundColor: '#712177',
    paddingBottom: 0,
    paddingTop: 0,
  },
  title: {
    fontWeight: 'bold',
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
  buttonHalf: {
    width: '48%',
    marginTop: 16,
    marginHorizontal: 5,
  },
  tabToday: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
  },
  tabWeek: {
    backgroundColor: '#FFFFFF',
  },
  tabMonth: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 30,
  },
});
