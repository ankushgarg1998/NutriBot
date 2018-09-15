'use strict'

const Telegram = require('telegram-node-bot');

var fs = require('fs');
var dataObj = JSON.parse(fs.readFileSync('./datastore/data.json', 'utf8'));


class CommandController extends Telegram.TelegramBaseController {
    pingHandler($) {
        $.sendMessage(`Sup ?`);
    }

    ateHandler($) {
        $.sendMessage(`Great! What did you eat ?`);
        $.waitForRequest
            .then($ => {
                dataObj.today.push($.message.text);
                $.sendMessage(`Ok! I've added ${$.message.text} to your diet history.`);
            });
    }

    get routes() {
        return {
            'pingCommand': 'pingHandler',
            'ateCommand': 'ateHandler'
        };
    }
}

module.exports = CommandController;