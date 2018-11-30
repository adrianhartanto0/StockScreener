const db = require('./db');
const utility = require('./utility');

async function retrieveTicker(currentTime, tickerSymbol, quantity) {

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

module.exports.retrieveTicker = retrieveTicker;

module.exports.getPrevTicker = async (lastTickerTime, symbol) => {
  let prevTickerClose = 0;
  const prevTickers = await retrieveTicker(lastTickerTime, symbol);
  
  for (let i = 0; i < prevTickers.length; i += 1) {
    const time = parseInt(prevTickers[i].time) * 1000;
    const timeDiff = utility.getDiffDays(lastTickerTime, time, 'hour')

    if (timeDiff > 0) {
      return prevTickers[i];
    }
  }

}