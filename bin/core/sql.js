const { keywords } = require("./keywords")
const { theme } = require('../util/constraints')
const chalk = require('chalk')

const uniquify = (arr) => {
  const set = new Set()
  arr.forEach(item => set.add(item))
  return Array.from(set.values())
}

const hightlightSQL = (text) => {
  const lines = text.split('\n').filter((item, i) => !(item === '' && i < 10))
  const index = lines.findIndex(item => item.includes('BANCO WEB')) + 1

  const colorizeSQL = (value, type = '') => {
    switch(type) {
      case 'number':
        return chalk.hex(theme.sql.number)(value)
      case 'function':
        return chalk.hex(theme.sql.function)(value)
      case 'string':  
        return chalk.hex(theme.sql.string)(value)
      case 'field':
        return chalk.hex(theme.sql.field)(value)
      default: 
        if (keywords.includes(value))
          return chalk.hex(theme.sql.keywords)(value)
    }
    return value
  }

  const sql = lines.slice(index)
    .map(line => { 
      let str = line
      const words = uniquify(str.match(/([A-Z])\w+/gi) ?? [])
      const tables = uniquify(str.replace('\n', ' ').match(/(?<=(from|join|update|into) )(\w+)/gi) ?? [])
      const functions = uniquify(str.match(/(\w+)(?=\()/gi)?? [])
      const strings = uniquify(str.match(/\'(.*?)\'/gi) ?? [])
      const numbers = uniquify(str.match(/([0-9])+/) ?? [])
 
      words.forEach(word => str = str.replace(new RegExp(`\\b${word}\\b`, 'gi'), colorizeSQL(word)))
      functions.forEach(word => str = str.replace(new RegExp(`\\b${word}\\b`, 'gi'), colorizeSQL(word, 'function')))
      numbers
        .filter(word => !strings.some(item => item.includes(word)))
        .forEach(word => str = str.replace(new RegExp(`\\b${word}\\b`, 'gi'), colorizeSQL(word, 'number')))
      words.filter(word => 
        !keywords.includes(word) 
        && !functions.includes(word)
        && !tables.includes(word)
        && !strings.some(string => string.includes(word)))
        .forEach(word => str = str.replace(new RegExp(`\\b${word}\\b`, 'gi'), colorizeSQL(word, 'field')))
      strings.forEach(word => str = str.replace(new RegExp(String.raw`${word}`.replace(/[()[\]'"+*<>!@#$%¨&_+=?|~^\\]/gi, item => '\\' + item), 'gi'), colorizeSQL(word, 'string')))
      str = str.replace(/(\s{2,15})/gi, '  ').trim()
      return str
  })
  return sql.join('\n')
}

module.exports = { hightlightSQL }