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

export const getDateWeekAgo = (DATE_FORMAT_TYPE = DATE.FORMATS.DEFAULT) => {
  if (DATE_FORMAT_TYPE === DATE.FORMATS.DB_UNIX) {
    const date = moment()
      .subtract(7, 'days')
      .toDate();
    date.setHours(0);
    date.setMinutes(0);
    date.setMilliseconds(0);
    date.setSeconds(0);
    return date.getTime();
  }
  return moment()
    .subtract(7, 'days')
    .format(DATE_FORMAT_TYPE);
};
