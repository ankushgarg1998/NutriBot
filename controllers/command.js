'use strict'

const Telegram = require('telegram-node-bot');

class CommandController extends Telegram.TelegramBaseController {
    pingHandler($) {
        $.sendMessage(`Sup ?`);
    }

    get routes() {
        return {
            'pingCommand': 'pingHandler'
        };
    }
}

module.exports = CommandController;