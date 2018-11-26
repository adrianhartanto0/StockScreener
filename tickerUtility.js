const db = require('./db');

module.exports.insertTicker = async (tickerSymbol, tickerHigh, tickerLow, tickerClose, tickerOpen, currentTime) => {
  await db('ticker')
    .insert({
      symbol: tickerSymbol,
      high: tickerHigh,
      low: tickerLow,
      close: tickerClose,
      open: tickerOpen,
      time: currentTime,
    })
}

module.exports.retrieveTicker = async (currentTime, tickerSymbol, quantity) => {

  let result;

  if (quantity) {
    result = await db('ticker')
      .where('time', '<', currentTime)
      .andWhere({ symbol: tickerSymbol })
      .limit(quantity)
      .orderBy('time', 'desc')
  } else {
    result = await db('ticker')
      .where('time', '<', currentTime)
      .andWhere({ symbol: tickerSymbol })
      .orderBy('time', 'desc')
  }

  return result;
}