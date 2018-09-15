'use strict'

const Telegram = require('telegram-node-bot');
const axios = require('axios');

axios.defaults.headers.common['x-app-id'] = '286ec226';
axios.defaults.headers.common['x-app-key'] = '4f7aa51f12261c3468911ee647a096ee';
axios.defaults.headers.post['Content-Type'] = 'application/json';

var fs = require('fs');
var dataObj = JSON.parse(fs.readFileSync('./datastore/data.json', 'utf8'));

var userObj = JSON.parse(fs.readFileSync('./datastore/user.json', 'utf8'));
var foodObj = JSON.parse(fs.readFileSync('./datastore/food.json', 'utf8'));


class CommandController extends Telegram.TelegramBaseController {

    addFoodAte(user, food) {
        const date = new Date();
        const dateString = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
        if (!(userObj[user].history[dateString]))
            userObj[user].history[dateString] = {
                'food': [],
                'nutrients': {
                    "protein": 0,
                    "fat": 0,
                    "calories": 0,
                    "calcium": 0,
                    "iron": 0
                }
            };
        userObj[user].history[dateString].food.push(food);
        return dateString;
    }

    inputHandler($) {
        $.sendMessage(`Hey! I'm the Health-Bot. What should I call you ?`);
        $.waitForRequest
            .then($ => {
                const username = $.message.from.username;
                if (!userObj[username])
                    userObj[username] = {
                        "history": {}
                    };
                userObj[username].name = $.message.text;
                $.sendMessage(`Hi! ${$.message.text}. What's your gender ?`);
                $.waitForRequest
                    .then($ => {
                        const ans = $.message.text;
                        if (ans === 'male' || ans === 'Male' || ans === 'm' || ans === 'M') {
                            userObj[username].gender = 'm';
                        } else {// if(ans === 'female' || ans === 'Female' || ans === 'f' || ans === 'F') {
                            userObj[username].gender = 'f';
                        }
                        $.sendMessage(`What's your age ?`);
                        $.waitForRequest
                            .then($ => {
                                userObj[username].age = parseInt($.message.text);
                                console.log(userObj);
                                $.sendMessage(`Alright! You data is Recorded.\nName: ${userObj[username].name}\nGender: ${userObj[username].gender}\nAge: ${userObj[username].age}`);
                            });
                    });
            });
    }

    pingHandler($) {
        $.sendMessage(`Sup ?`);
        console.log($.message.from.username);
    }

    ateHandler($) {
        $.sendMessage(`Great! What did you eat ?`);
        $.waitForRequest
            .then($ => {
                const ans = $.message.text;
                axios.post('https://trackapi.nutritionix.com/v2/natural/nutrients', {
                    "query": ans,
                    "timezone": "US/Eastern"
                })
                    .then((response) => {
                        const user = $.message.from.username;
                        const dateString = this.addFoodAte(user, ans);
                        userObj[user].history[dateString].nutrients.protein += response.data.foods[0].nf_protein;
                        userObj[user].history[dateString].nutrients.fat += response.data.foods[0].nf_total_fat;
                        userObj[user].history[dateString].nutrients.calories += response.data.foods[0].nf_calories;
                        response.data.foods[0].full_nutrients.forEach(obj => {
                            if(obj.attr_id === 301) {
                                userObj[user].history[dateString].nutrients.calcium += obj.value;
                            }
                        });
                        response.data.foods[0].full_nutrients.forEach(obj => {
                            if(obj.attr_id === 303) {
                                userObj[user].history[dateString].nutrients.iron += obj.value;
                            }
                        });
                        console.log(userObj[user].history[dateString]);
                    })
                    .catch((error) => {
                        $.sendMessage(`Sorry! Could not find any such food item.`);
                        console.log(error);
                    });
            });
    }

    get routes() {
        return {
            'inputCommand': 'inputHandler',
            'pingCommand': 'pingHandler',
            'ateCommand': 'ateHandler'
        };
    }
}

module.exports = CommandController;