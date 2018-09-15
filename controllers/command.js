'use strict'

const Telegram = require('telegram-node-bot');
const axios = require('axios');

// ------------------------- Request Headers for Nutritionix API -----------
axios.defaults.headers.common['x-app-id'] = '286ec226';
axios.defaults.headers.common['x-app-key'] = '4f7aa51f12261c3468911ee647a096ee';
axios.defaults.headers.post['Content-Type'] = 'application/json';


// -------------------------- Importing JSONs ---------------------------
var fs = require('fs');
var userObj = JSON.parse(fs.readFileSync('./datastore/user.json', 'utf8'));
var dietObj = JSON.parse(fs.readFileSync('./datastore/diet.json', 'utf8'));
var deficiency = JSON.parse(fs.readFileSync('./datastore/deficiency.json', 'utf8'));
var suggestions = JSON.parse(fs.readFileSync('./datastore/suggestions.json', 'utf8'));
var threats = JSON.parse(fs.readFileSync('./datastore/threats.json', 'utf8'));
var tips = JSON.parse(fs.readFileSync('./datastore/tips.json', 'utf8'));

var markD = {
    "parse_mode": "Markdown"
};


class CommandController extends Telegram.TelegramBaseController {

    // ------------------------ Helper Functions --------------------------
    giveDateString() {
        const date = new Date();
        return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
    }

    initializeUser(user) {
        const dateString = this.giveDateString();
        if(!userObj[user])
            userObj[user] = {
                "name": "",
                "gender": "m",
                "age": 18,
                "category": "17",
                "history": {}
            };
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
    }

    addFoodAte(user, food) {
        this.initializeUser(user);
        const dateString = this.giveDateString();
        userObj[user].history[dateString].food.push(food);
        return dateString;
    }

    deficiencyObj(obj, username) {
        let newObj = {};
        Object.keys(obj).forEach(key => {
            if(dietObj[userObj[username].category][key] - obj[key] < deficiency[key]) {
                newObj[key] = 1;
            } else
                newObj[key] = 0;
        });
        return newObj;
    }

    // ----------------------- Handler Functions --------------------------

    startHandler($) {
        $.sendMessage(`Hi.`, markD);
    }

    helpHandler($) {
        $.sendMessage(`Help`, markD);
    }

    inputHandler($) {
        $.sendMessage(`Hey! I'm *the NutriBot*. What should I call you ?`, markD);
        $.waitForRequest
            .then($ => {
                const username = $.message.from.username;
                this.initializeUser(username);
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
                                $.sendMessage(`Alright! You data is Recorded.\n*Name*: ${userObj[username].name}\n*Gender*: ${userObj[username].gender}\n*Age*: ${userObj[username].age}\n\nYou can now start logging about what you eat.`, markD);
                            });
                    });
            });
    }

    ateHandler($) {
        $.sendMessage(`Okay! What did you eat/drink ?`);
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
                        // Calcium - 301
                        response.data.foods[0].full_nutrients.forEach(obj => {
                            if(obj.attr_id === 301) {
                                userObj[user].history[dateString].nutrients.calcium += obj.value;
                            }
                        });
                        // Iron - 303
                        response.data.foods[0].full_nutrients.forEach(obj => {
                            if(obj.attr_id === 303) {
                                userObj[user].history[dateString].nutrients.iron += obj.value;
                            }
                        });
                        $.sendMessage(`Recorded.`);
                    })
                    .catch((error) => {
                        $.sendMessage(`Sorry! Could not find any such food item.`);
                        console.log(error);
                    });
            });
    }

    analysisHandler($) {
        this.initializeUser($.message.from.username);
        const obj = userObj[$.message.from.username].history[this.giveDateString()].nutrients;
        const newObj = this.deficiencyObj(obj, $.message.from.username);

        $.sendMessage(`*YOUR DIET ANALYSIS*\n\n\
- *Protein*: ${newObj.protein ? "Your protein intake is fine.": "Your diet is *deficient* in protein."}\n\
- *Fat*: ${newObj.fat ? "Your fat intake is fine.": "Your diet is *deficient* in fats."}\n\
- *Calories*: ${newObj.calories ? "Your calories intake is fine.": "Your diet is *deficient* in calories."}\n\
- *Calcium*: ${newObj.calcium ? "Your calcium intake is fine.": "Your diet is *deficient* in calcium."}\n\
- *Iron*: ${newObj.iron ? "Your iron intake is fine.": "Your diet is *deficient* in iron."}\n\
        `, markD);
    }

    suggestionsHandler($) {
        this.initializeUser($.message.from.username);
        const obj = userObj[$.message.from.username].history[this.giveDateString()].nutrients;
        const newObj = this.deficiencyObj(obj, $.message.from.username);

        let ans = "*SUGGESTIONS*\n\n";
        Object.keys(newObj).forEach(key => {
            if(newObj[key] === 0) {
                ans += `- Since your diet is *deficient* in *${key}*. We recommend you to add some ${key} rich food items to your diet like: `;
                let first = 0;
                suggestions[key].forEach(item => {
                    ans += `${item}, `;
                    if(first < 1) {
                        ++first;
                        $.sendPhoto(suggestions[key + '_img']);
                    }
                });
                ans += `etc.\n\n`;
            }
        });
        if(ans === `*SUGGESTIONS*\n\n`) {
            ans += `No suggestions for you. Your diet is absolutely fine! :D`;
        }
        $.sendMessage(ans, markD);
    }

    threatsHandler($) {
        this.initializeUser($.message.from.username);
        const obj = userObj[$.message.from.username].history[this.giveDateString()].nutrients;
        const newObj = this.deficiencyObj(obj, $.message.from.username);
        
        let ans = "*THREATS*\n\n";
        Object.keys(newObj).forEach(key => {
            if(newObj[key] === 0) {
                ans += `Due to deficiency of *${key}*.\n`;
                threats[key].forEach(item => {
                    ans += `- ${item}\n`;
                });
                ans += `\n\n`;
            }
        });
        if(ans === `*THREATS*\n\n`) {
            ans += `No threats ahead of you. Your diet is absolutely fine! :D`;
        }
        $.sendMessage(ans, markD);
    }

    quicktipHandler($) {
        $.sendMessage('*Random Health Tip*\n\n' + tips[Math.floor(Math.random() * tips.length)], markD);
    }

    // --------------------------- Routes ------------------------------

    get routes() {
        return {
            'startCommand': 'startHandler',
            'helpCommand': 'helpHandler',
            'inputCommand': 'inputHandler',
            'ateCommand': 'ateHandler',
            'analysisCommand': 'analysisHandler',
            'suggestionsCommand': 'suggestionsHandler',
            'threatsCommand': 'threatsHandler',
            'quicktipCommand': 'quicktipHandler'
        };
    }
}

module.exports = CommandController;