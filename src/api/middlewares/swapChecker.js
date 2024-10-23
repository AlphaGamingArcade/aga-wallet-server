const httpStatus = require('http-status');
const { getQuoteExactTokensForTokens } = require('../services/chains/agaProvider');
const BigNumber = require('bignumber.js');

exports.swapChecker = async (req, res, next) => {
  const { pair, amount } = req.body;

  if (!pair || !amount) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "Missing required fields 'pair' or 'amount' in the request body",
    });
  }

  if (typeof amount !== 'string' || isNaN(amount) || Number(amount) <= 0) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "'amount' should be a positive numeric value in string format",
    });
  }

  if (
    typeof pair !== 'object' ||
    !Array.isArray(pair) ||
    pair.length !== 2 ||
    (!pair[0].Native && !pair[0].WithId) ||
    (!pair[1].Native && !pair[1].WithId)
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      message: "'pair' should be an array of two objects containing either 'Native' or 'WithId' key",
    });
  }

  next();
};


exports.calculateSwapQuoteAndFee = async (pair, amount, include_fee) => {
  try {
    if (include_fee === "false") {
      const swapQuoteWithoutFee = await getQuoteExactTokensForTokens(pair, amount, false);
      return {
        pair,
        amount,
        include_fee,
        fee: null,
        quote: swapQuoteWithoutFee,
      };
    }

    const swapQuote = await getQuoteExactTokensForTokens(pair, amount, true);
    if (!swapQuote || isNaN(Number(swapQuote.replace(/,/g, '')))) {
      throw new Error('Invalid swap quote received from chain.');
    }

    let fee = null;

    if (include_fee === "true") {
      const swapQuoteWithoutFee = await getQuoteExactTokensForTokens(pair, amount, false);

      if (!swapQuoteWithoutFee || isNaN(Number(swapQuoteWithoutFee.replace(/,/g, '')))) {
        throw new Error('Invalid swap quote without fee received from chain.');
      }

      const quoteWithFeeBN = new BigNumber(swapQuote.replace(/,/g, ''));
      const quoteWithoutFeeBN = new BigNumber(swapQuoteWithoutFee.replace(/,/g, ''));
      fee = quoteWithFeeBN.minus(quoteWithoutFeeBN);

      if (fee.isNaN()) {
        throw new Error('Fee calculation resulted in NaN');
      }
    }

    return {
      pair,
      amount,
      include_fee,
      fee: fee ? fee.toString() : null,
      quote: swapQuote,
    };
  } catch (error) {
    throw new Error(`Failed to calculate swap quote: ${error.message}`);
  }
};
