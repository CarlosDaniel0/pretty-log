const { Terminal } = require("../entities/Terminal");
const { handleError } = require("./functions");

/**
 *
 * @param {Date} date
 * @returns
 */
const getLog = async (date) => {
  try {
    {
      const terminal = new Terminal()
      terminal.init(date)
    }
  } catch (e) {
    handleError(e)
  }
};

module.exports = { getLog }