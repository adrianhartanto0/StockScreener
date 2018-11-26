const moment = require('moment');

module.exports.getDiffDays = (timeOne, timeTwo, key) => {
  const timeOneMoment = moment(timeOne);
  const timeTwoMoment = moment(timeTwo);
  let timeDiff; 

  if (key) {
    timeDiff = timeOneMoment.diff(timeTwoMoment, key);
  } else {
    timeDiff = timeOneMoment.diff(timeTwoMoment, 'days');
  }

  return timeDiff
}

module.exports.roundToOneDecimal = (num) => {
  return Math.round(num * 10) / 10;
}