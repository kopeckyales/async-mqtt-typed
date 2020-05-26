const fs = require('fs');
const path = require('path');
const { getConfig, getTypesFileAbsolutePath } = require('./config');
const log = require('./log');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  return fs.mkdirSync(dirname);
}

function getTopics() {
  return getConfig().topics || [];
}

function getTopicVariables(topic) {
  return topic.variables || [];
}

function getOutputAbsolutePath() {
  return path.resolve(process.cwd(), getConfig().outputPath);
}

function mqttTopicToRegexpr(topic) {
  return topic.replace(/\//g, '\\/').replace(/\+/g, '([^\\/|]+)').replace(/#/g, '.*');
}

function generateTypes() {
  return fs.readFileSync(getTypesFileAbsolutePath()).toString();
}

function generateSubscriptionsConst() {
  return `const subscriptions: {
  topic: string,
  topicRegex: RegExp,
  callback: (arg0:any, ...args: string[])=>void
}[] = [];`;
}

function generateRegexMap() {
  return [
    'const SubscriptionToTopicRegexMap = {',
    ...getTopics().map((t) => `  '${t.name}': /^${mqttTopicToRegexpr(t.name)}$/,`),
    '};',
  ].join('\n');
}

function generatePrepareFunctionOverloads() {
  return [
    ...getTopics().map((t) => `function prepareSubscribtion(topic:'${t.name}', callback:(payload:${t.payloadType}${
      getTopicVariables(t).map((x) => `, ${x}:string`).join('')})=>void): void;`),
    `function prepareSubscribtion<T extends keyof typeof SubscriptionToTopicRegexMap>(
  topic:T,
  callback:(arg0:any, ...args: string[])=>void,
) {
  const topicRegex = SubscriptionToTopicRegexMap[topic] as any as RegExp;
  subscriptions.push({ topic, topicRegex, callback });
}

export {
  prepareSubscribtion,
};`,
  ].join('\n');
}

function generateRunFunction() {
  return `export async function runSubscriptions(client: MQTT.AsyncClient): Promise<MQTT.ISubscriptionGrant[]> {
  client.on('message', (topic, payload) => {
    subscriptions.some((x) => {
      const result = topic.match(x.topicRegex);
      if (result == null) {
        return false;
      }
      x.callback(JSON.parse(payload.toString()), ...result.slice(1));
      return true;
    });
  });
  return client.subscribe(subscriptions.map((x) => x.topic));
}`;
}

ensureDirectoryExistence(getOutputAbsolutePath());
const stream = fs.createWriteStream(getOutputAbsolutePath());

stream.once('open', () => {
  stream.write(`import MQTT from 'async-mqtt';

${generateTypes()}

${generateSubscriptionsConst()}

${generateRegexMap()}

${generatePrepareFunctionOverloads()}

${generateRunFunction()}
`);
  stream.end();
  log.success(`Generate output ${getOutputAbsolutePath()}`);
});
