const { Log } = require("./Log");
const readline = require("readline");
const loading = require("loading-cli");
const { highlight, formatString, styleTextPolyfill, countWords } = require("../core/functions");
const hljs = require("highlight.js");
const { headerLang, theme } = require("../util/constants");
const chalk = require("chalk");

class Terminal {
  start = 0;
  row = 0;
  column = 0;
  rows = -1;
  columns = -1;
  viewText = ''
  search = { value: '', show: false, result: false, history: { content: [], index: 0 }, current: 0 }
  rl = null
  file = null

  constructor() {
    const { columns, rows } = process.stdout;
    this.rows = rows
    this.columns = columns
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    })
    console.clear();
    this.rl.on('line', () => this.handleSearch(this))
    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on("keypress", (str, key) => this.handleKeys(this, str, key))
    process.stdout.on("resize", () => this.handleResize(this));
    hljs.registerLanguage('header', headerLang)
  }

  toggleSearch() {
    this.search = { ...this.search, value: '', show: !this.search.show, cursor: this.file.line }
    this.row = this.rows
    this.column = 1
    process.stdout.write(`\u001b[${this.rows};${1}H`);
    process.stdout.clearLine(0);
    if (this.search.show) {
      process.stdout.write(`>`); // 🔎
      readline.cursorTo(process.stdout, 1, this.rows)
    }
    else setTimeout(() => {
      this.show()
      process.stdout.clearLine(0);
      readline.cursorTo(process.stdout, 0, this.rows)
    }, 5);
  }
  /**
   * 
   * @param {string?} text 
   */
  show(text) {
    let viewText = ''
    for (let i = 0; i < this.rows; i++) {
      process.stdout.write(`\u001b[${i};0H`);
      process.stdout.clearLine(0);
      const line = `${this.file.lines?.[this.file.line - this.rows - 1 + i] ?? "~"}\n`
      viewText += line
      process.stdout.write(
        highlight(line.substring(this.start, this.start + this.columns - 1), text)
        + (line.substring(this.start + this.columns - 1).length > 1
          ? '~'
          : line.substring(this.start + this.columns))
      );
    }
    this.viewText = viewText;
  }

  /**
   * 
   * @param {Date} date 
   */
  init(date) {
    const load = loading('Aguarde...').start()
    try {
      this.file = new Log(date)
      this.file.read(this.rows)
      this.file.line--
      this.show()
      this.row = this.rows;
    } catch (e) {
      setTimeout(() => this.rl.close(), 3 * 1000)
      throw e
    } finally {
      load.stop()
    }
  }

  handleResize(self) {
    const { columns, rows } = process.stdout;
    const [, dy] = [columns - self.columns, rows - self.rows]
    self.columns = columns;
    self.rows = rows;
    if (dy > 0) self.file.read(dy)
    self.show()
  }

  handleSearch(self) {
    const value = self.search.value
    if (!value.trim()) return
    if (self.file.open) self.file.read(null, value, Math.ceil(this.rows / 2))
    const list = self.file.lines.map((line, index) => ({ line, index }))
    const { index } = list.slice(self.search.cursor).find(({ line }) => formatString(line).includes(formatString(value))) ?? { line: '', index: -1 }
    const total = countWords(list.map(({ line }) => line).join(' '), value)
    if (!self.search.history.content.includes(value)) {
      self.search.history.content.push(value)
      self.search.history.index++
    }
    self.search.result = true
    const isLast = self.search.current === total
    if (index !== -1) {
      self.file.line = Math.ceil(self.rows / 2) + index + 1
      self.show(value)
      const quantity = self.search.current + countWords(self.viewText, value)
      self.search.current = Math.min(total, isLast ? 1 : quantity)
    }
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    const search = `>${self.search.value}`
    const quantity = `${self.search.current}/${total}`
    const pad = ' '.repeat(self.columns - quantity.length - search.length)
    self.search.cursor = index === -1 ? 0 : self.file.line + 1
    process.stdout.write(`${search}${pad}${quantity}`)
    setTimeout(() => process.stdout.cursorTo(value.length + 1), 5)
  }

  async handleKeys(self, str, key) {
    if (key.ctrl && key.name === "c") {
      console.clear();
      self.rl.close();
    } else if (key.ctrl && key.name === 'b') {
      self.toggleSearch()
    } else if (str === "\b") {
      if (self.search.show && self.column > 1) {
        self.column = Math.max(--self.column, 1);
        self.search.current = 0
        const [start, end] = [
          self.search.value.substring(0, self.column - 1),
          self.search.value.substring(self.column)
        ].map(el => el || '')
        if (self.search.result) {
          this.show()
          self.search.result = false
        }
        self.search.value = start + end;
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0);
        process.stdout.write(`>${self.search.value}\u001b[${self.row};${self.column + 1}H`);
      }
    } else if (
      key.name
      && ["up", "down", "right", "left", 'e', 's'].some((k) => ['e', 's'].includes(k) ? !self.search.show : key.name.includes(k))
    ) {
      if (key.name === "up" || key.name !== 's') {
        if (key.name !== 's' && self.search.show) {
          self.search.history.index = Math.max(--self.search.history.index, 0)
          const value = self.search.history.content[self.search.history.index]
          self.search.value = value
          self.column = value.length + 1
          process.stdout.clearLine(0)
          process.stdout.cursorTo(0);
          process.stdout.write(`>${value}`);
          process.stdout.cursorTo(value.length + 1);
        } else {
          if (key.name === 's') {
            self.file.line = self.rows + 1
            self.show()
          }
          self.row = Math.max(--self.row, 0);
          if (self.row === 0) {
            self.file.line--;
            self.show()
          }
        }
      }
      if ((key.name === "down" || key.name === 'e')) {
        if (key.name !== 'e' && self.search.show) {
          self.search.history.index = Math.min(++self.search.history.index, self.search.history.content.length - 1)
          const value = self.search.history.content[self.search.history.index]
          self.search.value = value
          self.column = value.length + 1
          process.stdout.clearLine(0)
          process.stdout.cursorTo(0);
          process.stdout.write(`>${value}`);
          setTimeout(() => process.stdout.cursorTo(value.length + 1), 5);
        }
        else {
          if (key.name === 'e') {
            process.stdout.cursorTo(self.rows)
            process.stdout.clearLine(0);
            const load = loading('Aguarde...').start()
            self.file.read()
            if (!self.file.open) self.file.line = self.file.eof + (self.file.line < 0 ? 2 : 1)
            load.stop()
            self.show()
          }
          self.row = Math.min(++self.row, self.rows);
          if (self.row === self.rows) {
            if (self.file.open) self.file.read(1)
            else self.file.line++
            self.show()
          }
        }
      }
      if (!self.search.show && key.name === "pageup") self.row = 0;
      if (!self.search.show && key.name === "pagedown") self.row = self.rows;
      if (key.name === "right") {
        self.column = Math.min(
          key.ctrl ? self.columns : ++self.column,
          self.search.show ? self.search.value.length + 1 : self.columns
        );
        if (!self.search.show && self.column === self.columns) {
          self.start = Math.min(self.file.columns + 10, self.start += self.columns - 1)
          self.show()
        }
      }
      if (key.name === "left") {
        self.column = Math.max(key.ctrl ? 0 : --self.column, self.search.show ? 1 : 0);
        if (!self.search.show && self.column === 0) {
          self.start = Math.max(0, self.start -= self.columns - 1)
          self.show()
        }
      }
      if (!self.search.show || !['up, down'].includes(key.name))
        process.stdout.cursorTo(self.column, self.row);
    } else {
      if (str && key.name !== 'return') {
        self.column = Math.min(++self.column, self.columns);
        if (self.search.show) {
          if (self.column < (self.search.value.length + 2)) {
            const [start, end] = [
              self.search.value.substring(0, self.column - 2),
              self.search.value.substring(self.column - 2)
            ].map(el => el || '')
            self.search.value = start + str + end
            process.stdout.clearLine(0)
            process.stdout.write(`\u001b[${self.row};${0}H>${self.search.value}\u001b[${self.row};${self.column + 1}H`)
          } else {
            self.search.value = self.search.value += str
            process.stdout.write(str);
          }
        }
      }
    }
  }

  format(value, language) {
    const highlighted = hljs.highlight(value, { language }).value
    return highlighted.replace(/<span class="hljs-(\w+)">(.*?)<\/span>/g, (tag) => {
      if (tag.includes("<span")) {
        const type = (tag.match(/hljs-(\w+)/g) ?? [])?.[0].replace(
          "hljs-",
          ""
        );
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
   * @returns 
   */
  highlight(str) {
    if (str.match(ignore)) return format(str, 'header').replace(ignore, (e) => styleTextPolyfill('bold', e))
    return format(str, str.match(ignore) ? 'header' : 'sql')
  }

}

module.exports = { Terminal }
