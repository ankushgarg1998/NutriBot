'use strict'

const Telegram = require('telegram-node-bot');
const tg = new Telegram.Telegram('633863790:AAG4T43_Vew2PDcnRGQGfbdehru6w3iHrUE', {
    workers: 1
});


const CommandController = require('./controllers/command');
const OtherwiseController = require('./controllers/otherwise');

const commandController = new CommandController();

tg.router
    .when(new Telegram.TextCommand('/input', 'inputCommand'), commandController)
    .when(new Telegram.TextCommand('/ping', 'pingCommand'), commandController)
    .when(new Telegram.TextCommand('/ate', 'ateCommand'), commandController)
    .otherwise(new OtherwiseController());
