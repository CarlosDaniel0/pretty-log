const colorize = (key, value) => {
  switch(key) {  
    default: return (value ?? key)
  }
}

const highlightHeader = (text) => {
  const lines = text.split('\n').filter((item, i) => !(item === '' && i < 10))
  const index = lines.findIndex(item => item.includes('BANCO WEB')) + 1

  const header = lines.slice(0, index)
    .map(line => { 
      let str = line
      const key = line.match(/^(\w+)(?: (\w+)|)/gi)?.[0]
      const value = line.match(/(?<=: )(\w+).*/gi)?.[0]
      str = str.replace(key, colorize(key))
      str = str.replace(value, colorize(key, value))   
      return str
  })
  return header.join('\n')
}

module.exports = { highlightHeader }