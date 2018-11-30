require('dotenv').config();

const moment = require('moment');
const chalk = require('chalk');


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

module.exports.highlightNumber = (num) => {

  let newNum = num;

  if (num > 0) {
    newNum = chalk.bold.bgGreen(`+${Math.abs(num)}%`);
  } else if (num < 0){
    newNum = chalk.bold.bgRed(`-${Math.abs(num)}%`);
  }

  return newNum;
}

module.exports.checkEnvVariable = () => {

  const isContentCountEmpty = process.env.CONTENT_COUNT.length === 0;
  const isDATAUrlEmpty = process.env.DATA_URL.length === 0;

  if (isContentCountEmpty || isDATAUrlEmpty) {
    const error = new Error('Environment variable is empty');
    throw error;
  }

  try {
    parseInt(process.env.CONTENT_COUNT);
  } catch(e) {
    const error = new Error('Content Count is not a number');
    throw error;
  }

  return true
}