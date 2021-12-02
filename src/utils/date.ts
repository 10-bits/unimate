import moment from 'moment';
import {DATE} from 'src/services/types';

export const getDateToday = (DATE_FORMAT_TYPE = 'Do MMMM YYYY') => {
  if (DATE_FORMAT_TYPE === '') {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setMilliseconds(0);
    today.setSeconds(0);
    return today.getTime();
  }
  return moment().format(DATE_FORMAT_TYPE);
};

export const getDateFromDatabaseDateFormat = dateDB => {
  return moment(dateDB).format(DATE.FORMATS.DEFAULT);
};

export const getRelativeTime = (dateString: string | number | undefined) => {
  return moment(dateString).fromNow();
};
