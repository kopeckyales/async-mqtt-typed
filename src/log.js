/* eslint-disable no-console */
function error(message) {
  console.log('\x1b[91m', '×', '\x1b[0m', message);
}

function warning(message) {
  console.log('\x1b[93m', '‼', '\x1b[0m', message);
}

function success(message) {
  console.log('\x1b[32m', '√', '\x1b[0m', message);
}

module.exports = {
  error,
  warning,
  success,
};
