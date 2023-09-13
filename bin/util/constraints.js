const colors = {
  purple: {
    300: '#9d6bfa' 
  },
  pink: {
    300: '#c77be0',
    500: '#dd63ff'
  },
  yellow: {
    700: '#edc834'
  },
  blue: {
    50: '#86dbfc',
    200: '#18baf0'
  },
  green: {
    300: '#52bf71',
    800: '#377358',
  }
}

const theme = {
  sql: {
    number: colors.purple[300],
    function: colors.green[300],
    string: colors.yellow[700],
    field: colors.blue[200],
    keywords: colors.pink[500],
    divider: colors.blue[50]
  },
  search: {
    selection: colors.green[800]
  }
}

module.exports = { theme }