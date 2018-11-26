const db = require('./db');
const utility = require('./utility');
const tulind = require('tulind');

module.exports.retrieve = async (symbol, indicatorNames, indicatorPeriods, currentTime, limitQty) => {

  let dbResponse;

  if (limitQty) {
    dbResponse = db('indicators')
      .whereIn('indicatorPeriod', indicatorPeriods)
      .where('indicatorName', indicatorNames)
      .where('symbol', symbol)
      .where('time', '<', currentTime)
      .orderBy('time', 'desc')
      .limit(limitQty)
  } else {
    dbResponse = await db('indicators')
      .whereIn('indicatorPeriod', indicatorPeriods)
      .where('indicatorName', indicatorNames)
      .where('symbol', symbol)
      .orderBy('time', 'desc')
  }

  return dbResponse
}


module.exports.calculateIndicator = async (indicator, data, period) => {
  let indicatorFunc;

  if (indicator === 'sma') {
    indicatorFunc = tulind.indicators.sma.indicator;
  } else if (indicator === 'dema') {
    indicatorFunc = tulind.indicators.dema.indicator;
  }

  const indicatorData = await indicatorFunc([data], [period]);
  return utility.roundToOneDecimal(indicatorData.pop().pop());
}


module.exports.insert = async (tickerSymbol, name, value, period, currentTime) => {
  await db('indicators')
    .insert({
      symbol: tickerSymbol,
      indicatorName: name,
      indicatorValue: value,
      indicatorPeriod: period,
      time: currentTime,
    })
}

module.exports.filter = (data, indicatorName, indicatorPeriod) => {
  const filteredData = data.filter(tickerData => 
    tickerData.indicatorName === indicatorName && tickerData.indicatorPeriod == indicatorPeriod
  )

  return (filteredData.length > 0 ? filteredData.pop() : null);
}
