const _ = require('lodash');
const { isHex, hexToString } = require('@polkadot/util');

exports.convertKeysToSnakeCase = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = _.snakeCase(key);
    acc[snakeKey] = obj[key];
    return acc;
  }, {});
}


// Function to check if a value is hex and convert it
exports.convertHexToString = (value) => {
    if (isHex(value)) {
        return hexToString(value); // Convert hex to string
    }
    return value; // Return null if the input is not hex
}