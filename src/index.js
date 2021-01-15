'use strict';

const GiveawayController = require(__dirname + '/controllers/controller.js');
const GiveawayModel = require(__dirname + '/models/giveaway.js');

const controller = new GiveawayController(
  document.getElementsByTagName('canvas')[0]
);

controller.init();
controller.render();
const model = new GiveawayModel(controller);

model.initModel();
