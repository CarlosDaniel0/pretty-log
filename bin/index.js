
const { getLog } = require("./core/output");
require("dotenv").config({ path: String.raw`C:\Users\DEV-01\Documents\Development\Node\beautiful-log\.env` });
const yargs = require("yargs");

yargs
  .command(
    "dt <date>",
    "show log of passed date",
    (yargs) => {
      yargs.positional("date", {
        describe: "date of the log",
        type: "string",
        demandOption: true,
      });
    },
    async (argv) => getLog(argv.date))
  .command(
    "$0",
    "show default log of current date",
    () => {},
    () => getLog()
  ).argv;
