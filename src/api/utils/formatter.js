const _ = require('lodash');

exports.convertKeysToSnakeCase = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = _.snakeCase(key);
    acc[snakeKey] = obj[key];
    return acc;
  }, {});
}