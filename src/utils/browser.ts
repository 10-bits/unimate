import {Linking, Platform} from 'react-native';
import SafariView from 'react-native-safari-view';

export const openBrowserAsync = (url: string): Promise<any> => {
  if (Platform.OS === 'ios') {
    return openInAppUrl(url).catch(() => openUrl(url));
  } else {
    return openUrl(url);
  }
};

export const openInAppUrl = (url: string): Promise<any> => {
  return SafariView.isAvailable().then(() => SafariView.show({url}));
};

export const openUrl = (url: string): Promise<any> => {
  return Linking.openURL(url);
};
