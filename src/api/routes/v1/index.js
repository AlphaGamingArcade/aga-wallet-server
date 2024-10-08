const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const walletRoutes = require("./wallet.route");
const accountRoutes = require("./account.route");
const transactionRoutes = require("./transactions.route")
const assetRoutes = require("./asset.route")
const notificationRoutes = require("./notification.route")
const gameRoutes = require("./game.route")
const messagingRoutes = require("./messaging.route")
const agaRoutes = require("./aga.route")

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/assets', assetRoutes);
router.use('/notifications', notificationRoutes);
router.use('/games', gameRoutes);
router.use('/messagings', messagingRoutes);
router.use('/accounts', accountRoutes);
router.use('/aga', agaRoutes);

module.exports = router;
