const fs = require('fs');
const Table = require('cli-table2');
const chalk = require('chalk')
const inquirer = require('inquirer');
const ora = require('ora');
const axios = require('axios');
const moment = require('moment');
const interval = require('interval-promise');
const _ = require('lodash');


const indicatorUtility = require('./indicatorUtility');
const tickerUtility = require('./tickerUtility');
const utility = require('./utility');
const crossUtility = require('./crossUtility');

const maxContentCount = 35;
process.stdin.setRawMode(true);

async function askPrompt() {
  const questions = [
    {
      type: 'input',
      name: 'sma',
      message: 'SMA Period:',
      default: '10, 175',
    },
    {
      type: 'input',
      name: 'dema',
      message: 'DEMA Period:',
      default: '10, 100',
    }
  ]

  const answers = await inquirer.prompt(questions);

  let smaPeriods = answers.sma.split(", ");
  const intSMAPeriods = smaPeriods.map(periods => parseInt(periods));
  
  smaPeriods = {};
  smaPeriods.low = intSMAPeriods[0];
  smaPeriods.high = intSMAPeriods[1];

  let demaPeriods = answers.dema.split(", ");
  const intDemaPeriods = demaPeriods.map(periods => parseInt(periods));

  demaPeriods = {};
  demaPeriods.low = intDemaPeriods[0];
  demaPeriods.high = intDemaPeriods[1];

  const value = {};
  value["dema"] = demaPeriods;
  value["sma"] = smaPeriods;

  return value;
}

async function loadTechnicalData(pageSymbols) {
  const last6Month = moment().subtract(10, "months").format("MM/DD/YYYY");
  const today = moment().format("MM/DD/YYYY");

  const priceRequestPromises = pageSymbols.map(async (symbol) => {
    const response = await axios({
      method:'get',
      url:'',
      params: {
        code: symbol,
        start: last6Month,
        end: today,
      }
    })

    // milliseconds
    const lastTickerTime = response.data[response.data.length - 1][0]; 

    // Get history ticker
    const result = await tickerUtility.retrieveTicker(moment().unix(), symbol, 1)
    let lastSavedTickerTime; 

    if (result.length && result.length === 1) {
      const lastSavedTicker = result.pop()
      lastSavedTickerTime = parseInt(lastSavedTicker.time);
    } else {
      lastSavedTickerTime = parseInt(result.time);
    }

    // Get time diff
    const getTickerDiffDays = utility.getDiffDays(
      lastTickerTime, lastSavedTickerTime * 1000
    )
    
    if (getTickerDiffDays > 0) {
      const lastClose = response.data[response.data.length - 1][4];
      const lastHigh = response.data[response.data.length - 1][2];
      const lastLow = response.data[response.data.length - 1][3];
      const lastOpen = response.data[response.data.length - 1][1];
  
      // Save Ticker Data
      await tickerUtility.insertTicker(
        symbol, lastHigh, lastLow, lastClose, lastOpen, moment().unix()
      )
    }

    const data = { 
      close: response.data.map(technical => technical[4]),
      lastClose: response.data[response.data.length - 1][4],
      lastTickerTimestamp: lastTickerTime
    }

    const value = {};
    value[symbol] = data

    return value;
  })

  const responses = await Promise.all(priceRequestPromises);

  return responses.reduce((accumulator, value) => {
    return Object.assign(accumulator, value);
  }, {}); 
}


async function renderData(page, symbolData, promptAnswers) {
  const startCounter = (page * maxContentCount);
  const tempMaxCount = (startCounter + maxContentCount);
  const maxCount = tempMaxCount > symbolData.length ? symbolData.length : tempMaxCount;
  const pageSymbols = []

  for(let i = startCounter; i < maxCount; i += 1) {
    pageSymbols.push(symbolData[i]);
  }

  const spinner = ora('Loading stock data').start();
  const technicalData = await loadTechnicalData(pageSymbols);
  const sma = promptAnswers.sma;
  const dema = promptAnswers.dema;
  const value = {};

  const indicatorPromises = pageSymbols.map(async (pageSymbol) => {

    const { close, lastTickerTimestamp } = technicalData[pageSymbol];
    const indicators = ["sma", "dema"];
    value[pageSymbol] = [];

    await Promise.all(indicators.map(async (indicator) => {
      // Indicator value
      const indicatorLow = await indicatorUtility.calculateIndicator(
        indicator, close, promptAnswers[indicator].low
      );

      const indicatorHigh = await indicatorUtility.calculateIndicator(
        indicator, close, promptAnswers[indicator].high
      );

      const isCrossover = indicatorUtility.isIndicatorsCross(
        indicatorLow, indicatorHigh
      );

      const data = [
        { value: indicatorLow, period: promptAnswers[indicator].low },
        { value: indicatorHigh, period: promptAnswers[indicator].high },     
      ]

      const crossChangeValue = await crossUtility.getCrossChange(
        pageSymbol, indicator, lastTickerTimestamp, data
      )

      await indicatorUtility.saveIndicators(
        pageSymbol, indicator, lastTickerTimestamp, data
      );

      value[pageSymbol].push(indicatorLow)
      value[pageSymbol].push(indicatorHigh)

      value[pageSymbol].push(
        utility.roundToOneDecimal(indicatorLow - indicatorHigh)
      )

      value[pageSymbol].push(crossChangeValue)
      value[pageSymbol].push(isCrossover);
    }))

    return value
  })

  const indicators = await Promise.all(indicatorPromises);
  const indicatorsObject = indicators.reduce((accumulator, value) => {
    return Object.assign(accumulator, value)
  }, {})

  const table = new Table({
    head:[
      "Symbol", "Close Price", `SMA${sma.low}`, `SMA${sma.high}`, "SMA DIFF", "SMA DIFF %", "SMA Cross", 
      `DEMA${dema.low}`, `DEMA${dema.high}`, "DEMA DIFF", "DEMA DIFF %", "DEMA Cross", "AO"
    ],
    colWidths:[9, 14, 12, 12, 12, 12, 13, 13, 11, 11, 13, 13]
  })

  for(let i = 0; i < pageSymbols.length; i += 1) {
    let data = [
      chalk.bold.blue(pageSymbols[i]), 
      `Rp ${technicalData[pageSymbols[i]].lastClose}`
    ]

    data = data.concat(indicatorsObject[pageSymbols[i]]);
    table.push(data)
  }

  spinner.stop();
  console.log(table.toString())
}

function loadSymbolData() {
  const tickerSymbols = fs.readFileSync("./symbols.txt", 'utf-8');
  const parsedTickerSymbols = tickerSymbols.split(", ");
  return parsedTickerSymbols
}

async function iterateFunc(page, symbolData, answers) {
  console.log('\033c')
  await renderData(page, symbolData, answers)
}

async function main() {
  const answers = await askPrompt();
  const symbolData = await loadSymbolData();

  let page = 0;
  const maxPageCount = Math.round(symbolData.length / maxContentCount);

  process.stdin.on('keypress', (str, key) => {
    switch(key.name) {
      case "n":
        page++;
        if (page > maxPageCount) {
          page = maxPageCount
        } else {

          interval(async () => {
            await iterateFunc(page, symbolData, answers)
          }, 86400000)

          iterateFunc(page, symbolData, answers);
          process.stdin.resume()
        }

      break;
      case "p":
        page--;

        if (page < 0) {
          page = 0;
        } else { 

          interval(async () => {
            await iterateFunc(page, symbolData, answers);
          }, 86400000)

          iterateFunc(page, symbolData, answers);
          process.stdin.resume()
        }
      break;
    }
  });
  
  interval(async () => {
    await iterateFunc(page, symbolData, answers );
  }, 86400000)

  await iterateFunc(page, symbolData, answers);
  process.stdin.resume()
}

main();





