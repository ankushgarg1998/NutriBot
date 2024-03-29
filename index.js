'use strict'

const Telegram = require('telegram-node-bot');
const keys = require('./config/keys');
const tg = new Telegram.Telegram(keys.token, {
    workers: 1
});

const CommandController = require('./controllers/command');
const OtherwiseController = require('./controllers/otherwise');

const commandController = new CommandController();

tg.router
    .when(new Telegram.TextCommand('/start', 'startCommand'), commandController)
    .when(new Telegram.TextCommand('/help', 'helpCommand'), commandController)    
    .when(new Telegram.TextCommand('/input', 'inputCommand'), commandController)
    .when(new Telegram.TextCommand('/ate', 'ateCommand'), commandController)
    .when(new Telegram.TextCommand('/analysis', 'analysisCommand'), commandController)
    .when(new Telegram.TextCommand('/suggestions', 'suggestionsCommand'), commandController)
    .when(new Telegram.TextCommand('/threats', 'threatsCommand'), commandController)
    .when(new Telegram.TextCommand('/quicktip', 'quicktipCommand'), commandController)
    .otherwise(new OtherwiseController());
