const expresss = require("express")
const { validate } = require('express-validation');
const accountController = require('../../controllers/account.controller');
const transactionController = require('../../controllers/transaction.controller');
const agaController = require('../../controllers/aga.controller');
const { getAccount, accountSwapExactTokensForTokens, accountAddLiquidity, accountRemoveLiquidity, accountCreateLiquidityPool } = require("../../validations/account.validation");
const { authorize } = require("../../middlewares/auth");
const { listAccountTransactions, sendTransaction } = require("../../validations/transaction.validation");
const { authorizeCloudMessaging } = require('../../middlewares/cloudMessaging');

const router = expresss.Router();

/**
 * Load account when API with account_address route parameter is hit
 */
router.param('account_address', accountController.load);

router.route('/:account_address')
  .get(authorize(), validate(getAccount), accountController.get);

router.route('/:account_address/transactions')
  .get(authorize(), validate(listAccountTransactions), transactionController.list);

router
  .route('/:account_address/transactions/send')
  .post(authorize(), validate(sendTransaction), authorizeCloudMessaging(), transactionController.send)

/**
 * SWAPS
 */
router
  .route('/:account_address/swaps/swap-exact-tokens-for-tokens')
  .post(
    authorize(),
    validate(accountSwapExactTokensForTokens), 
    agaController.swapExactTokensForTokens
  ); 

// /**
//  * Liquidity Pools
//  */

router
  .route('/:account_address/liquidity-pools/create-pool')
  .post(
    authorize(),
    validate(accountCreateLiquidityPool), 
    agaController.createLiquidityPool
  );

router
  .route('/:account_address/liquidity-pools/add-liquidity')
  .post(
    authorize(),
    validate(accountAddLiquidity), 
    agaController.addLiquidity
  );

router
  .route('/:account_address/liquidity-pools/remove-liquidity')
  .post(
    authorize(),
    validate(accountRemoveLiquidity), 
    agaController.removeLiquidity
  );

module.exports = router