const { getQuoteExactTokensForTokens } = require('../services/chains/agaProvider');
const BigNumber = require('bignumber.js');

exports.calculateSwapQuoteAndFee = async (pair, amount, include_fee) => {
  try {
    const includeFee = include_fee === "true";
    const swapQuote = await getQuoteExactTokensForTokens(pair, amount, includeFee);
    if (!swapQuote) throw new Error('Invalid swap quote received from chain.');

    let fee = null;
    if (includeFee) {
      const swapQuoteWithoutFee = await getQuoteExactTokensForTokens(pair, amount, false);
      if (!swapQuoteWithoutFee) throw new Error('Invalid swap quote without fee received from chain.');
      fee = new BigNumber(swapQuote.replace(/,/g, '')).minus(new BigNumber(swapQuoteWithoutFee.replace(/,/g, '')));
      if (fee.isNaN()) throw new Error('Fee calculation resulted in NaN');
    }

    return { pair, amount, include_fee, fee: fee?.toString() ?? null, quote: swapQuote };
  } catch (error) {
    throw new Error(`Failed to calculate swap quote: ${error.message}`);
  }
};
