import {Text} from '@ui-kitten/components';
import React from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {getDateToday} from '../../utils/date';
// import { Text } from '@ui-kitten/components';

export const SaythanxItem = (props): React.ReactElement => {
  const [text, setText] = React.useState<string>('');

  return (
    <TouchableOpacity
      style={{
        paddingVertical: 4,
        // flexDirection: 'row',
        justifyContent: 'space-between',
        // alignItems: 'center',
        borderRadius: 5,
        marginBottom: 6,
        borderColor: '#DDD',
        borderWidth: 1,
      }}>
      {props.item.date !== getDateToday() && (
        <Text style={[{marginHorizontal: 16, marginVertical: 4}]} status="info">
          {props.item.date}
        </Text>
      )}
      <Text style={[{marginHorizontal: 16, fontSize: 14, marginVertical: 2}]}>
        {props.item.text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    marginTop: 2,
    marginBottom: 2,
    marginLeft: 8,
  },
});
