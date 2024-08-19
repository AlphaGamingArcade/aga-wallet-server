const express = require('express');
const router = express.Router();
const controller = require("../../controllers/game.controller");
const { authorize } = require('../../middlewares/auth');
const { validate } = require('express-validation');
const { getGame, listGames, listGenres } = require('../../validations/game.validation');


/**
 * Load wallet when API with asset_id route parameter is hit
 */
router.param('game_id', controller.load);

router.route('/')
  .get(authorize(), validate(listGames), controller.list);

router.route('/genres')
  .get(authorize(), validate(listGenres), controller.listGenres);

router.route('/:game_id')
  .get(authorize(), validate(getGame), controller.get);

module.exports = router