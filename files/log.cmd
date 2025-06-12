:: Created by npm, please don't edit manually.
@ECHO OFF

SETLOCAL

SET "NODE_EXE=%~dp0\node.exe"
IF NOT EXIST "%NODE_EXE%" (
  SET "NODE_EXE=node"
)

SET "FIRETS_CLI_JS=%~dp0\node_modules\pretty-log\bin\index.js"

"%NODE_EXE%" "%FIRETS_CLI_JS%" %*
