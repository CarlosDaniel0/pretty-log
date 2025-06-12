const NRL = require("n-readlines");
const fs = require('fs')
const { logName, formatString } = require("../core/functions");

class Log {
  log = null;
  line = 1;
  content;
  lines = [];
  eof = -1;
  open = false;
  columns = 0;

  /**
   * 
   * @param {Date} date 
   */
  constructor(date) {
    const file = logName(date)
    if (!fs.existsSync(file))
      throw new Error(`O Arquivo ${file.split(/\\/g).pop()} não existe`)
    this.log = new NRL(file)
  }

  /**
   *
   * @param {number} rows
   * @param {string?} value
   */
  read(rows, value, middle) {
    let index = 1, proceed = true, found = 0
    this.open = true
    while (proceed && (this.content = this.log.next())) {
      const line = this.content.toString("ascii");
      this.eof = this.line;
      this.lines.push(line);
      this.line++;
      this.columns = Math.max(this.columns, line.length)
      index++
      if ((value && formatString(line)?.includes(formatString(value)))) found = index
      if ((rows && index > rows) || (found && index > (index + middle))) proceed = false
    }
    if (!this.content) this.open = false
  }
}

module.exports = { Log }