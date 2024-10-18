const httpStatus = require("http-status");
const { DEFAULT_QUERY_LIMIT, DEFAULT_QUERY_OFFSET } = require("../utils/constants");


exports.listSwaps = (req, res, next) => {
  try {
    
    return res.json({
      swaps: [
        
      ]
    })
  } catch (error) {
    return next(error)
  }
} 