import {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {Layout, Text, TopNavigationAction} from '@ui-kitten/components';
import React from 'react';
import {Alert, Dimensions, ScrollView, StyleSheet, View} from 'react-native';
import GoogleFit, {Scopes} from 'react-native-google-fit';
import * as Progress from 'react-native-progress';
import {API} from '../../refactored-services';
import {StorageKeys} from '../../refactored-services/storage.service';
import {getCals, getDists, getSteps} from '../../api/googleFitApi';
import BarChart from '../../components/bar-chart.component';
import {MenuIcon} from '../../components/icons';
import TraxivityDataTab from '../../components/traxivity-data.component';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export class TraxivityTodayScreen extends React.Component {
  tab: any[];
  user: FirebaseAuthTypes.User | null = null;

  constructor(props) {
    super(props);
    this.setSelectedIndex = this.setSelectedIndex.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.state = {
      selectedIndex: 0,
      steps: 0,
      cals: 0,
      dists: 0,
      goal: 5000,
      user: {},
    };
    this.tab = [];
  }

  renderDrawerAction = (): React.ReactElement => (
    <TopNavigationAction
      icon={MenuIcon}
      onPress={this.props.navigation.toggleDrawer}
    />
  );

  setSelectedIndex(index) {
    this.setState({selectedIndex: index});
  }

  async componentDidMount() {
    const user = await API.storage.getDataFromStorage<FirebaseAuthTypes.User>(
      StorageKeys.USER,
    );
    this.user = user;
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({user});
    GoogleFit.isAvailable((err, res) => {
      if (err || !res) {
        Alert.alert(
          'Download Google Fit',
          'No data available for this account, please download Google Fit.\n\nKeep in mind that the account you use for Unimate and the account you use for Google Fit should be the same.',
          [{text: 'OK', style: 'cancel'}],
        );
        return;
      }
    });

    const options = {
      scopes: [Scopes.FITNESS_ACTIVITY_READ_WRITE],
    };
    GoogleFit.authorize(options)
      .then(res => {
        this._getData();
      })
      .catch(err => console.log(err));

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({goal: API.traxivity.goal});

    API.firestore.subscribeForTraxivity(
      this.user ? this.user.uid : '',
      this.onSuccess,
    );
  }

  onSuccess(documentSnapshot) {
    console.log('traxdoc');
    console.log(documentSnapshot.data().dailyStepGoal);
    this.setState({goal: documentSnapshot.data().dailyStepGoal});
  }

  async _getData() {
    var start = new Date();
    var end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const options = {
      startDate: start,
      endDate: end,
    };

    getSteps(options, null, res => {
      //this.setState({steps: [{value: 493}]})
      this.setState({steps: res.length > 0 ? res[0].value : 0});
    });

    getCals({...options, basalCalculation: false}, res => {
      console.log(res[0]);
      this.setState({cals: res ? res[0].calorie : 0});
    });

    getDists(options, res => {
      this.setState({dists: res ? res[0].distance : 0});
    });

    for (let i = 0; i < 24; i++) {
      start.setHours(i, 0, 0, 0);
      end.setHours(i, 59, 59, 999);
      var optionsTab = {
        startDate: start,
        endDate: end,
      };
      getSteps(optionsTab, i, (res, index) => {
        this.tab[index] = res.length > 0 ? res[0] : {date: '', value: 0};
        if (index == 23) {
          this.forceUpdate();
        }
      });
    }
  }

  render() {
    var progress =
      this.state.steps > this.state.goal
        ? 100
        : Math.round((this.state.steps * 100) / this.state.goal);
    var BoxData = {
      numBox1: this.state.goal,
      textBox1: 'Daily Goal',
      numBox2: this.state.steps,
      textBox2: 'Steps Today',
      numBox3: this.state.cals,
      textBox3: 'Kcal burned',
      numBox4: this.state.dists / 1000,
      textBox4: 'Kilometers',
    };

    var formatter = [];
    for (let i = 0; i < 24; i++) {
      formatter.push(i.toString());
    }
    return (
      <Layout style={styles.tabContainer}>
        <ScrollView style={{flex: 1}}>
          <View style={{alignItems: 'center', margin: 10}}>
            <Progress.Circle
              size={screenWidth / 1.6}
              progress={progress / 100}
              color="#712177"
              thickness={10}
              showsText={true}
            />
          </View>
          <View style={{height: screenHeight / 1.5, marginBottom: 0}}>
            <TraxivityDataTab data={BoxData} />
            <BarChart
              tabStep={this.tab}
              formatter={formatter}
              granularity={4}
            />
            <Text style={{textAlign: 'center'}}>
              👣 Data shown in the Traxivity are captured from Google Fit.
            </Text>
          </View>
        </ScrollView>
      </Layout>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  tabContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    height: '100%',
  },
  title: {
    color: '#712177',
    fontWeight: 'normal',
  },
  bar: {
    height: 40,
  },
  tabView: {},
  tabViewIndicator: {
    backgroundColor: '#712177',
    borderRadius: 0,
  },
  active_title: {
    color: '#712177',
    fontWeight: 'bold',
  },
  inactive_title: {
    fontWeight: 'bold',
  },
});
