const fs = require('fs')
const chalk = require('chalk') 
const readline = require('readline') 
const { theme } = require('../util/constraints')
const { hightlightSQL } = require('./sql')
const { highlightHeader } = require('./header')
const { logName, getLog } = require('./functions')

const highlight = (text, cols) => {
  let str = text
  str = str
    .split('\n')
    .map(line => 
      line.length > cols ? line.replace(new RegExp(`.{${cols}}`, 'g'), item => `${item}\n`) : line)
    // .filter((_,i) => i>= 3265 && i <= 3380)
    .join('\n')
  const chunks = str.split('*'.repeat(92))  
  return chunks.filter((item) => item).map(chunk =>
    '\n\n' + highlightHeader(chunk) + '\n' + hightlightSQL(chunk)).join(chalk.hex(theme.sql.divider)('*'.repeat(92)))
}

const findContent = (text, value) => {
  const regex = new RegExp(value.replace(/[',+*()\\]/gi,item => `\\${item}`), 'gi')
  return Array.from(text.matchAll(regex)).map(match => [
    match.index, 
    match.index + match[0].length, 
    (match.input.substring(0, match.index + match[0].length).split('\n') ?? []).length - 2])
}

const hightlightSearch = (text, word) => { 
  if (!word) return text  
  return text.replace(new RegExp(word, 'gi'), value => chalk.bgHex(theme.search.selection)(value)).split('\n') 
}

const stripAnsi = text => 
  text.replace( /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

const output = async (params) => {
  let [data, date] = params
  if (!data) return
  let 
    lines = process.stdout.rows,
    cols = process.stdout.columns,
    search = false,
    searchLine = false
    position = 1,
    page = 1,
    mutex = 0,
    searchIndex = -1,
    searchValue = '',
    searchLineValue = 1,
    occurencesSearch = []
  let content = highlight(data, cols).split('\n')
  let maxPages = Math.ceil(content.length / (lines - 2))

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const clean = () => { 
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout); 
  }

  const update = () => { 
    if (mutex) return
    mutex = 1
    clean() 
    var stop = false;
    for (var i = 0; i < lines; i++) {
      if (i === 0) {
        console.log(content[i + position] ?? '')
      } else if (i === (lines - 2)) {
        stop = true;
        console.log(`Ctrl+C Exit${' '.repeat(cols - (30 + String(page).length + String(maxPages).length + String(position).length))}↑up ↓down ${page}/${maxPages} - l ${position}`)
        if(searchLine) {
          rl.question(`Search line (1-${content.length - lines}): `, function(anwser) {
            searchLineValue = parseInt(anwser)
            if (Number.isNaN(searchLineValue)) {
              searchLineValue = 1
              searchLine = false
            }
            position = Math.max(1, searchLineValue)
            page = Math.max(1, Math.ceil(position/(lines - 2)))
            update()
          })
          if (searchLineValue) 
            rl.write(searchLineValue)
        } 
        if(search) {
          rl.question("Search value: ", function(answer) { 
            searchValue = answer
            occurencesSearch = findContent(stripAnsi(data), searchValue)
            content = hightlightSearch(highlight(data), searchValue) 
            if (search && searchValue && occurencesSearch.length) {
              searchIndex = (occurencesSearch.length - 1) === searchIndex ? 0 : Math.min(occurencesSearch.length - 1, ++searchIndex)
              position = Math.min(content.length - lines, Math.max(1,occurencesSearch[searchIndex][2] - Math.floor(lines/2) + 1)) 
              page = Math.min(maxPages, Math.ceil(position/(lines - 2))) 
            }
            update() 
          });
          if (searchValue) 
            rl.write(searchValue)
        } 
      } else if(stop === false){
        console.log(content[i + position] ?? '');
      }
    } 
    mutex = 0
  }
 
  const src = logName(date)
  fs.watchFile(src, { interval: 1000, bigint: false, persistent: false }, async (curr, prev) => {
    [data] = await getLog(date)  
    content = highlight(data, cols).split('\n')
    maxPages = Math.ceil(content.length / (lines - 2))
    update()
  })

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', async (str, key) => { 
      if (key.name === 'up') {  
        position = Math.max(1, --position)
        page = Math.max(1, Math.ceil(position/(lines - 2)))
        update()
      }
      if (key.name === 'down') {  
        position = Math.min(content.length - lines, ++position) 
        page = Math.min(maxPages, (content.length - lines) === position ? maxPages :  Math.ceil(position/(lines - 2)))
        update()
      } 
      if (key.name === 'pagedown') { 
        page = Math.min(maxPages, ++page)
        position = Math.min(content.length - lines, (Math.max(0,page - 1)) * (lines - 2))
        update()
      }
      if (key.name === 'pageup') {
        page = Math.max(1, --page)
        position = Math.min(content.length - lines, (Math.max(0,page - 1)) * (lines - 2))
        update()
      }
      if (key.ctrl && key.name === 'up') { 
        page = Math.max(1, 1)
        position = Math.max(1, 1)
        update()
      }
      if (key.ctrl && key.name === 'down') { 
        page = Math.max(1, maxPages)
        position = Math.min(content.length - lines, content.length - (lines - 2))
        update()
      }
      if (key.ctrl && key.name === 'f' && !searchLine) {
        search = !search
        searchValue = '' 
        content =  highlight(data, cols).split('\n')
        update()
      }
      if (key.ctrl && key.name === 'g' && !search) { 
        searchLine = !searchLine
        searchLineValue = 1
        content =  highlight(data, cols).split('\n')
        update()
      }
      if (key.ctrl && key.name === 'c' || key.name == 'escape') {
        process.stdout.write("\u001b[2J\u001b[0;0H")
        clean()
        process.exit(0)
      }
  })
  
  update()
} 
 
module.exports = { output }