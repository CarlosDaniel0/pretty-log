const chalk = require("chalk");
const { log_path, theme, replaces, ignore } = require("../util/constants");
const { networkInterfaces } = require("os");
const hljs = require("highlight.js");
const { styleText } = require('util');

/**
 * 
 * @param {'bold'|'underline'} type 
 * @param {string} value 
 * @returns 
 */
const styleTextPolyfill = (format, value) => typeof styleText === 'undefined' ? chalk[type](value) : styleText(format, value)

const format = (value, language) => {
  const highlighted = hljs.highlight(value, { language }).value
  return highlighted.replace(/<span class="hljs-(\w+)">(.*?)<\/span>/g, (tag) => {
    if (tag.includes("<span")) {
      const type = (tag.match(/hljs-(\w+)/g) ?? [])?.[0]
        .replace("hljs-", "");
      const value = Object.entries(replaces)
        .reduce((str, [key, value]) =>
          str.replace(new RegExp(key, 'g'), value),
          tag.replace(/<[^>]*>/g, ""));

      switch (type) {
        case 'version': return styleTextPolyfill('bold', value)
        case 'class': return styleTextPolyfill('underline', value)
        case 'method': return styleTextPolyfill('underline', value)
        case 'ip': return styleTextPolyfill('underline', value)
        case 'database': return styleTextPolyfill('underline', value)
        case 'user': return styleTextPolyfill('underline', value)
        case "keyword":
        case "type":
        case "operator":
          return chalk.hex(theme.sql.keywords)(value);
        case "built_in":
          return chalk.hex(theme.sql.function)(value);
        case "number":
          return chalk.hex(theme.sql.number)(value);
        case 'string':
          return chalk.hex(theme.sql.string)(value);
      }
    }
    return "";
  })
}

/**
 * 
 * @param {string} str 
 * @param {string?} text
 * @returns 
 */
const highlight = (str, text) => {
  if (str.match(ignore)) return format(str, 'header').replace(ignore, (e) => styleText('bold', e)).replace(new RegExp(text, 'gi'), value => chalk.bgHex(theme.search.selection)(value))
  return format(str, 'sql').replace(new RegExp(text, 'gi'), value => chalk.bgHex(theme.search.selection)(value))
}

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
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  return results;
};

/**
 * Format the file name used to find log file
 * @param {Date} date
 * @returns
 */
const logName = (date) => {
  const user = process.env.USER;
  const today =
    date ??
    new Date(new Date().setHours(0, 0, 0, 0)).toISOString().substring(0, 10);

  const IP = getNetworkAddres()["Ethernet"][0];
  const file = `Sql-React-${user}${today}-ip-${IP}.txt`;
  return log_path + file;
};

const handleError = (err) => console.log(chalk.red(err.message + ""));

const formatString = (value) => value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")

/**
 * @param {string} text
 * @param {string} value
 */
const countWords = (text, value) => (text.match(new RegExp(String.raw`${value}`, 'gi')) ?? []).length

module.exports = { logName, handleError, formatString, highlight, styleTextPolyfill, countWords };