const fs = require('fs');
const path = require('path');
const log = require('./log');

let config;

function getTypesFileAbsolutePath() {
  return path.resolve(process.cwd(), getConfig().typesFilePath);
}

function validateConfig(c) {
  if (!fs.existsSync(getTypesFileAbsolutePath())) {
    log.error(`Types file not found at ${getTypesFileAbsolutePath()}`);
    return false;
  }
  if (!c.topics || c.topics.length === 0) {
    log.warning('No topic defined');
  }
  return true;
}

function getConfig() {
  if (config === undefined) {
    const configFilePath = path.resolve(process.cwd(), 'mqtt-typed.json');
    if (!fs.existsSync(configFilePath)) {
      log.error(`Configuration file not found at ${configFilePath}`);
    }
    const rawdata = fs.readFileSync(configFilePath);
    config = JSON.parse(rawdata.toString());
    if (!validateConfig(config)) {
      process.exit(1);
    }
  }
  return config;
}

module.exports = {
  getConfig,
  getTypesFileAbsolutePath,
};
