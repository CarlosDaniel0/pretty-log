const chalk = require('chalk')
const fs = require('fs')
const { log_path } = require('../util/constraints')

const readFile = (file) => new Promise((resolve, reject) => {
  fs.readFile(file, (err, data) => {
    if (err) reject(err)
    resolve(data)
  }) 
}) 

const logName = (date) => {
  const today = date ?? new Date(new Date().setHours(0,0,0,0)).toISOString().substring(0, 10)
  const file = `SqlReact${today}-ip-192.168.10.38.txt`
  return log_path + file
}

const readLogFile = async (date) => {
  const src = logName(date)
  try {
    return [true, await readFile(src)]
  } catch (err) {
    return [false, err.message]
  }
}

const getLog = async (date) => {
  const [result, data] = await readLogFile(date)
  if (!result) throw new Error(data + '')
  return [data + '', date] 
}

const handleError = (err) => console.log(chalk.red(err.message + ''))

module.exports = { getLog, logName, handleError }