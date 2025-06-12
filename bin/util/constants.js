const pathDotEnv = String.raw`C:\Users\DEV-01\Documents\Development\Node\pretty-log\.env`
const colors = {
  purple: {
    300: '#9d6bfa',
    400: '#b392f0',
  },
  pink: {
    200: '#f97583',
    300: '#c77be0',
    500: '#dd63ff'
  },
  yellow: {
    400: '#f1ab63',
    700: '#edc834'
  },
  blue: {
    50: '#86dbfc',
    200: '#18baf0'
  },
  green: {
    300: '#52bf71',
    800: '#377358',
  },
  white: {
    0: '#fff'
  }
}

const theme = {
  sql: {
    number: colors.white[0],
    operator: colors.pink[200],
    function: colors.purple[400],
    string: colors.yellow[700],
    field: colors.blue[200],
    keywords: colors.pink[200],
    divider: colors.blue[50]
  },
  search: {
    selection: colors.green[800]
  }
}

const replaces = {
  '&lt;': '<',
  '&gt;': '>',
  '&#x27;': "'"
}

const ignore = /^(USUARIO|DATA|SCRIPT|REFERENTE|IP|VERSAO|PATH|NOMETELA|CLASSE|METODO|BANCO WEB|GET|POST|url|session_id|\*+)/g

require("dotenv").config({ path: pathDotEnv  });
const log_path = process.env.LOG_PATH

const headerLang = () => ({
  case_insensitive: true, // language is case-insensitive
  contains: [
    {
      className: "version",
      begin: /(?<=\: )[A-Z]+$/
    },
    {
      className: 'class',
      begin: /(?<=CLASSE         : )(\w+)/
    },
    {
      className: 'method',
      begin: /(?<=METODO         : )(\w+)/
    },
    {
      className: "ip",
      begin: /(?<=IP             : )(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/
    },
    {
      className: 'database',
      begin: /(?<=BANCO WEB      : ).*/,
    },
    {
      className: 'user',
      begin: /(?<=USUARIO        : ).*?(?= (\d{2}))/
    }
  ]
})

module.exports = { theme, log_path, replaces, ignore, headerLang, pathDotEnv }