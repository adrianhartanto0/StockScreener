const db = require('./db');

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
