import React from 'react';
import {StyleSheet, ScrollView, View, Dimensions, Alert} from 'react-native';
import {
  TopNavigation,
  TopNavigationAction,
  Divider,
  TabView,
  Tab,
  Layout,
  Text,
} from '@ui-kitten/components';
import * as Progress from 'react-native-progress';
import GoogleFit, {Scopes} from 'react-native-google-fit';
import firestore from '@react-native-firebase/firestore';
import {getSteps, getCals, getDists} from '../../api/googleFitApi';
import {SafeAreaLayout} from '../../components/safe-area-layout.component';
import {MenuIcon} from '../../components/icons';
import TraxivityDataTab from '../../components/traxivity-data.component';
import BarChart from '../../components/bar-chart.component';
import {GoogleSignin} from '@react-native-community/google-signin';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export class TraxivityScreen extends React.Component {
  tab: any[];

  constructor(props) {
    super(props);
    this.setSelectedIndex = this.setSelectedIndex.bind(this);
    this.state = {
      selectedIndex: 0,
      steps: 0,
      cals: 0,
      dists: 0,
      goal: 5000,
      user: null,
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

  componentDidMount() {
    console.log('trax');
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ_WRITE,
        //Scopes.FITNESS_BODY_READ_WRITE,
        //Scopes.FITNESS_LOCATION_READ_WRITE
      ],
    };
    GoogleFit.authorize(options)
      .then(res => {
        console.log('res');
        console.log(res);
        this._getData();
      })
      .catch(err => console.log(err));
    GoogleSignin.getCurrentUser()
      .then(user => {
        console.log('usr');
        console.log(user);
        this.setState({user});
      })
      .catch(err => console.log(err));

    this.props.navigation.addListener('didFocus', () => {
      const ref = firestore()
        .collection('users')
        .doc(this.state.user.user.id);

      firestore().runTransaction(async transaction => {
        const doc = await transaction.get(ref);

        if (!doc.exists) {
          transaction.set(ref, {
            user: this.state.user.user,
            dailyStepGoal: 5000,
          });
        } else {
          this.setState({goal: doc._data.dailyStepGoal});
        }
      });
    });

    GoogleFit.isAvailable((err, res) => {
      if (err || !res) {
        Alert.alert(
          'Download Google Fit',
          'No data available for this account, please download Google Fit.\n\nKeep in mind that the account you use for Unimate and the account you use for Google Fit should be the same.',
          [{text: 'OK', style: 'cancel'}],
        );
      }
    });
  }

  async _getData() {
    console.log('getdata');
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
      <SafeAreaLayout style={styles.safeArea} insets="top">
        <TopNavigation
          title="Traxivity"
          leftControl={this.renderDrawerAction()}
        />
        <Divider />
        <Layout style={styles.container}>
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
                  <View style={{height: screenHeight / 1.5, marginBottom: 180}}>
                    <TraxivityDataTab data={BoxData} />
                    <BarChart
                      tabStep={this.tab}
                      formatter={formatter}
                      granularity={4}
                    />
                  </View>
                </ScrollView>
              </Layout>
            </Tab>
            {/*<Tab titleStyle={this.state.selectedIndex === 1 ? styles.active_title : styles.inactive_title} title='Weekly'>
              <Layout style={styles.tabContainer}>
              <View style={{flex: 1}}>
                <BarChart tabStep={this.state.steps} formatter={formatter} granularity={1}/>
                <TraxivityDataTab data={BoxData}/>
              </View>
              </Layout>
            </Tab>
            <Tab titleStyle={this.state.selectedIndex === 2 ? styles.active_title : styles.inactive_title} title='Monthly'>
              <Layout style={styles.tabContainer}>
              <View style={{flex: 1}}>
                <BarChart tabStep={this.state.steps} formatter={formatter} granularity={5}/>
                <TraxivityDataTab data={BoxData}/>
              </View>
              </Layout>
            </Tab>*/}
          </TabView>
        </Layout>
      </SafeAreaLayout>
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
