const httpStatus = require("http-status");
const APIError = require("../errors/api-error");

exports.swapChecker = async (req, res, next) => {
    const { pair, amount } = req.body;
  
    if (!pair || !amount) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Missing required fields 'pair' or 'amount' in the request body"
      });
    }
  
    // You can also add other validations here if needed
    if (typeof amount !== 'string' || isNaN(amount) || Number(amount) <= 0) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "'amount' should be a positive numeric value in string format"
      });
    }
  
    if (typeof pair !== 'object' || (pair.Native === undefined && pair.WithId === undefined)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "'pair' should contain either 'Native' or 'WithId' key"
      });
    }
  
    next();
  };