const httpStatus = require('http-status');
const { getSwaps } = require('../services/chains/agaProvider');
const { calculateSwapQuoteAndFee } = require('../middlewares/swapChecker');

exports.listSwaps = async (req, res) => {
  try {
    const swaps = await getSwaps();
    return res.json({ swaps });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to fetch swaps',
      error: error.message,
    });
  }
};

exports.swapToken = async (req, res) => {
  try {
    const { pair, amount, include_fee } = req.body;
    const swapDetails = await calculateSwapQuoteAndFee(pair, amount, include_fee);
    return res.status(httpStatus.OK).json({
      message: 'Swap token request received',
      swap_details: swapDetails,
    });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to calculate swap quote',
      error: error.message,
    });
  }
};
