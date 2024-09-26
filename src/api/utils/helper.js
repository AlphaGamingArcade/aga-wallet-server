const Decimal = require("decimal.js")

const formatDecimalsFromToken = (base, decimals) => {
  return new Decimal(base || 0).dividedBy(Math.pow(10, parseFloat(decimals || "0"))).toFixed();
};

module.exports = {
    formatDecimalsFromToken
}
