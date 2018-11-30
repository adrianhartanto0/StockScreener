const indicatorUtility = require('./indicatorUtility');
const utility = require('./utility');
const chalk = require('chalk');
const _ = require('lodash');


function calculateCrossChange(currentLow, currentHigh, prevLow, prevHigh) {
  const currCrossValue = currentLow - currentHigh;
  let prevCrossValue = currCrossValue;

  if (prevLow && prevHigh) {
    prevCrossValue = prevLow - prevHigh;
  }

  let change = utility.roundToOneDecimal(currCrossValue - prevCrossValue);

  if (change > 0) {
    change = chalk.bold.bgGreen(change);
  } else if (change < 0) {
    change = chalk.bold.bgRed(change);
  }

  return change
}

module.exports.calculateCrossChange = calculateCrossChange;

module.exports.getCrossChange = async (tickerSymbol, indicatorName, lastTickerTimestamp, data) => {
  
  // Render prev indicator cross change
  const lowData = data[0];
  const highData = data[1];
  const periods = [lowData.period, highData.period]

  const dbIndicators = await indicatorUtility.retrieve(
    tickerSymbol, indicatorName, periods, lastTickerTimestamp
  );

  const filteredDBIndicators = [];

  periods.forEach(period => {
    const periodIndicators = dbIndicators.filter(indicator => (
      parseInt(indicator.indicatorPeriod) === period
    ))

    for(let i = 0; i < periodIndicators.length; i += 1){
      const dbIndicatorPeriod = parseInt(periodIndicators[i].time) * 1000;
      const hour = utility.getDiffDays(lastTickerTimestamp, dbIndicatorPeriod, 'hour')
      
      if (hour > 0) {
        filteredDBIndicators.push(_.cloneDeep(periodIndicators[i]))
        break;
      }
    }
  })

  const prevLow = indicatorUtility.filter(
    filteredDBIndicators, indicatorName, lowData.period
  );

  const prevHigh = indicatorUtility.filter(
    filteredDBIndicators, indicatorName, highData.period
  );

  const crossChangeValue = calculateCrossChange(
    lowData.value, highData.value,
    indicatorUtility.getIndicatorValue(prevLow),
    indicatorUtility.getIndicatorValue(prevHigh)
  )

  return crossChangeValue
}