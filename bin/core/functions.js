const chalk = require('chalk')
const fs = require('fs')
const { log_path } = require('../util/constants')
const { networkInterfaces } = require('os');

const readFile = (file) => new Promise((resolve, reject) => {
  fs.readFile(file, (err, data) => {
    if (err) reject(err)
    resolve(data)
  })
})

/**
 * https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
 */
const getNetworkAddres = () => {
  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  return results
}

/**
 * Format the file name used to find log file
 * @param {Date} date 
 * @returns 
 */
const logName = (date) => {
  const today = date ?? new Date(new Date().setHours(0, 0, 0, 0)).toISOString().substring(0, 10)
  const IP = getNetworkAddres()["Ethernet"][0]
  const file = `Sql-React-${today}-ip-${IP}.txt`
  return log_path + file
}

/**
 * Try read log file and return content, but if found error return error message
 * @param {Date} date 
 * @returns 
 */
const readLogFile = async (date) => {
  const src = logName(date)
  try {
    return [true, await readFile(src)]
  } catch (err) {
    return [false, err.message]
  }
}

/**
 * 
 * @param {Date} date 
 * @returns 
 */
const getLog = async (date) => {
  const [result, data] = await readLogFile(date)
  if (!result) throw new Error(data + '')
  return [data + '', date]
}

const handleError = (err) => console.log(chalk.red(err.message + ''))

module.exports = { getLog, logName, handleError }