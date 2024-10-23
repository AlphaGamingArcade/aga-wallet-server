const httpStatus = require("http-status");
const { getQuoteExactTokensForTokens } = require("../services/chains/agaProvider");

// Function to list all available swaps
exports.listSwaps = async (req, res, next) => {
  try {
    // Initialize API if needed
    await initializeApiInstance();

  
    const swapEntries = await apiInstance.query.assets.asset.entries();

    // Format the swap details to a user-friendly JSON structure
    const swaps = swapEntries.map(([key, asset]) => {
      const assetId = key.args[0].toString();
      const assetDetails = asset.toHuman();
      return {
        assetId,
        assetDetails,
      };
    });

    // Return the swaps in the response
    return res.json({
      swaps,
    });
  } catch (error) {
    console.error('Error fetching swaps:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch swaps",
      error: error.message,
    });
  }
};

exports.swapToken = async (req, res, next) => {
  try {
    // Extracting the data from request body
    const { pair, amount } = req.body;

    if (!pair || !amount) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Missing required fields 'pair' or 'amount' in the request body"
      });
    }

    let swapQuote;
    try {
      // Call the provider function to get the quote with pair information
      swapQuote = await getQuoteExactTokensForTokens(pair, amount);
      console.log("Swap quote received:", swapQuote);
    } catch (error) {
      console.error("Error calculating swap quote:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to calculate swap quote",
        error: error.message,
      });
    }

    return res.status(httpStatus.OK).json({
      message: "Swap token request received",
      swap_details: {
        pair,
        amount,
        quote: swapQuote,
      },
    });
  } catch (error) {
    console.error('Error in swapToken:', error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

