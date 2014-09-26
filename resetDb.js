/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add 'seed' parameter. It inserts required data for frontend app.
 */
"use strict";

/**
 * Run this script to recreate all tables. DB will be empty.
 */
var fs = require('fs');
var async = require('async');
var initDb = require('./db');

var DESC = "description";
var testData = {};

testData.searchForm =  [
    { id: 1, name: 'Default form', description: DESC, active: true }
];

var i = 1;
testData.searchFormField =  [
    { id: 1, sort: i++, form_id: 1, characteristic_id: 1 },
    { id: 2, sort: i++, form_id: 1, characteristic_id: 2 },
    { id: 3, sort: i++, form_id: 1, characteristic_id: 3 },

    { id: 5, sort: i++, form_id: 1, characteristic_id: 5 },
    { id: 6, sort: i++, form_id: 1, characteristic_id: 6 }
];

testData.searchFormFieldValue =  [
    { id: 1, field_id: 5, valuetype_id: 1},
    { id: 2, field_id: 5, valuetype_id: 2},
    { id: 3, field_id: 5, valuetype_id: 3},
    { id: 4, field_id: 5, valuetype_id: 4},
    { id: 5, field_id: 5, valuetype_id: 5},

    { id: 6, field_id: 6, valuetype_id: 6},
    { id: 7, field_id: 6, valuetype_id: 7},
    { id: 8, field_id: 6, valuetype_id: 8},
    { id: 9, field_id: 6, valuetype_id: 9},
    { id: 10, field_id: 6, valuetype_id: 10},
    { id: 11, field_id: 6, valuetype_id: 11},
    { id: 12, field_id: 6, valuetype_id: 12},
    { id: 13, field_id: 6, valuetype_id: 13},
];

testData.dashboard = [
    {id: 1, data: {
        "description": "<div>\n\t\t\t\t\t<div class=\"poster-left left\">\n\t\t\t\t\t\t<h1>Solution Mechanism Guide</h1>\n\t\t\t\t\t\t<p>is Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat</p>\n\t\t\t\t\t\t<a href=\"javascript:\" class=\"ash-btn clear\">\n\t\t\t\t\t\t\t<span class=\"ash-left left\"></span>\n\t\t\t\t\t\t\t<span class=\"ash-middle left\">Tell Me More</span>\n\t\t\t\t\t\t\t<span class=\"ash-right left\">\n\t\t\t\t\t\t\t\t<span class=\"go-icon right\"></span>\n\t\t\t\t\t\t\t</span>\n\t\t\t\t\t\t</a>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"poster-right right\">\n\t\t\t\t\t\t<h2 class=\"left\">How It Works:</h2>\n\t\t\t\t\t\t<div class=\"left choose\">\n\t\t\t\t\t\t\t<span class=\"level\">40%</span>\n\t\t\t\t\t\t\t<span class=\"level-icon\"></span>\n\t\t\t\t\t\t\t<span class=\"level-name clear\">Choose the KML</span>\n\t\t\t\t\t\t\t<br>\n\t\t\t\t\t\t\t<span class=\"level-data clear\">(Knowledge Maturity Level)</span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<span class=\"arrow left\"></span>\n\t\t\t\t\t\t<div class=\"left study\">\n\t\t\t\t\t\t\t<span class=\"level\">80%</span>\n\t\t\t\t\t\t\t<div class=\"level-icon\"></div>\n\t\t\t\t\t\t\t<span class=\"level-name clear\">Study the SMG</span>\n\t\t\t\t\t\t\t<br>\n\t\t\t\t\t\t\t<span class=\"level-data clear\">(Solution Mechanism Guide)</span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<span class=\"arrow left\"></span>\n\t\t\t\t\t\t<div class=\"left decision\">\n\t\t\t\t\t\t\t<span class=\"level\">Completed</span>\n\t\t\t\t\t\t\t<span class=\"level-icon\"></span>\n\t\t\t\t\t\t\t<span class=\"level-name clear\">Make the decision</span>\n\t\t\t\t\t\t\t<br>\n\t\t\t\t\t\t\t<span class=\"level-data clear\">(Achieve the goals efficiently)</span>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>",
        "logoutText": "Thank you for visiting the Solution Mechanism Guide!  <br> <br>\nPlease take a few minutes to provide your feedback! <br> <br>\nTo close this tool, please exit the browser.",
        "feedbackURL": "",
        "contactUsURL": "",
        "faqURL": "",
        "css": "#poster {\n    width: 960px;\n    height: 210px;\n    background:url(\"../img/poster_bg.png\") no-repeat;\n    position: relative;\n    top: -1px;\n}\n#poster .poster-left {\n    padding-left: 21px;\n    padding-top: 21px;\n    width: 330px;\n}\n#poster .poster-left p {\n    font-size: 12px;\n    padding-top: 14px;\n    line-height: 20px;\n    color: #252525;\n    text-shadow:0 1px 0 #fdd032;\n}\n#poster .poster-left h1 {\n    text-shadow: 0 1px 0 #f9d43d;\n    font-size: 22px;\n    position: relative;\n    color: #000;\n}\n#poster .poster-right {\n    margin-top: 20px;\n    width: 609px;\n}\n#poster .poster-right h2 {\n    font-weight: normal;\n    color: #fff;\n    font-size: 16px;\n    text-shadow:0 1px 0 #006d3a;\n}\n#poster .poster-right .choose {\n    width: 149px;\n    margin-left: 7px;\n}\n#poster .poster-right .choose .level {\n    margin-left: 48px;\n}\n#poster .poster-right .study .level {\n    margin-left: 60px;\n}\n.level-name {\n    position: relative;\n    left:15px;\n}\n#poster .poster-right .choose .level-icon {\n    margin-left: -9px;\n    width: 132px;\n    height: 132px;\n    display: block;\n    background: url('../img/level-guide-icon.png')no-repeat 0 0;\n    margin-top: 3px;\n    margin-bottom: 2px;\n}\n.poster-right span {\n    color: #fff;\n    text-shadow:0 1px 0 #006d3a;\n}\n#poster .poster-right .study {\n    width: 155px;\n}\n#poster .poster-right .study .level-icon {\n    width: 132px;\n    height: 132px;\n    display: block;\n    margin-left: 5px;\n    background: url('../img/level-guide-icon.png')no-repeat 0 -133px;\n    margin-top: 2px;\n    margin-bottom: 3px;\n}\n#poster .poster-right .decision {\n    width: 159px;\n}\n#poster .poster-right .decision .level {\n    margin-left: 44px;\n}\n#poster .poster-right .decision .level-icon {\n    width: 132px;\n    height: 132px;\n    display: block;\n    margin-left: 10px;\n    background: url('../img/level-guide-icon.png')no-repeat 0 -266px;\n    margin-top: 2px;\n    margin-bottom: 3px;\n}\n#poster .poster-right .arrow {\n    background: url('../img/home_post_icon.png')no-repeat 0 -38px;\n    width: 30px;\n    height: 20px;\n    display: block;\n    position: relative;\n    margin-left: -19px;\n    padding-right: 4px;\n    top:70px;\n    left: 3px;\n}\n#poster .poster-right .decision span, #poster .poster-right .study span, #poster .poster-right .choose span {\n    font-size: 14px;\n}\n#poster .poster-right .decision .level-data, #poster .poster-right .study .level-data, #poster .poster-right .choose .level-data {\n    width: 200px;\n    font-size: 12px;\n    display: inline-block;\n}",
        "images": [],
        "homeFilterText": "To use the Solution Mechanism Guide, please answer the set of questions.\nThen click on ‘Identify Solutions’ to see what mechanisms best fit your\nneeds!",
        "homeBannerHtml": "<div style=\"text-align: justify;\">\n                <h2>Solution Mechanism Guide</h2>\n                <p>The Solution Mechanism Guide (SMG) is a web-based, interactive guide that</p><ul style=\"list-style: inherit;font-size: 14px;line-height: 24px;margin-left: 18px;\"><li>Leverages existing\nand innovative problem solving methods and</li><li>Presents this information in a unique user experience so that users are empowered\nto make the best decision about which problem solving tool best meets their needs.</li></ul>\n            </div>"
    }}
];

testData.exampleType = [

    {
        "name": "Research",
        "id": 1
    },
    {
        "name": "Hardware/Technology",
        "id": 2
    },
    {
        "name": "Operations",
        "id": 3
    },
    {
        "name": "Medical",
        "id": 4
    },
    {
        "name": "Gather KML",
        "id": 5
    },
    {
        "name": "Synthesize KML",
        "id": 6
    },
    {
        "name": "Validate KML",
        "id": 7
    },
    {
        "name": "Networking",
        "id": 8
    }
];

initDb(function (err, db) {
    if (err) {
        throw err;
    }
    if (process.argv[2] === "seed") {

        //models can be accessed only after data init
        var names = Object.keys(testData);
        async.series([
            function (cb) {
                db.driver.execQuery(fs.readFileSync(__dirname + "/sql/seed/characteristic_types.sql", 'utf8'), cb);
            }, function (cb) {
                db.driver.execQuery(fs.readFileSync(__dirname + "/sql/seed/characteristics.sql", 'utf8'), cb);
            }, function (cb) {
                db.driver.execQuery(fs.readFileSync(__dirname + "/sql/seed/characteristic_type_values.sql", 'utf8'), cb);
            }, function (cb) {
                async.forEachSeries(names, function (name, callback) {
                    var model = db.models[name],
                        values = testData[name];
                    console.log('inserting: ' + name);
                    async.forEachSeries(values, function (value, cb) {
                        model.create(value, cb);
                    }, callback);
                }, cb);
            }
        ], function (err) {
            if (err) {
                throw err;
            }
            console.log("ok");
            process.exit(0);
        });
    } else {
        console.log("ok");
        process.exit(0);
    }
}, true);