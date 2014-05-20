/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

/**
 * Run this script to recreate all tables and insert test data for frontend application.
 */

var async = require('async');
var _ = require('underscore');
var Path = require('path');
var initDb = require('./db');
var config = require('./config/configuration');
var lorem = require('lorem');
var Moniker = require('moniker');
var moniker = Moniker.generator([Moniker.adjective, Moniker.noun], { glue: ' ' });

var smgCount = 7;
var helpCount = 10;
var examplesPerSmg = 3;

//random long description
function randomText() {
    return lorem.ipsum("w" + _.random(50, 100));
}

//random short description
function randomShortText() {
    return lorem.ipsum("w" + _.random(10, 30));
}

//random text and wrap it to <p>
function randomHtml() {
    return lorem.ipsum("lorem_p10");
}

//random 'True', 'False' string
function randomCheckbox() {
    return _.random(0, 1) % 2 ? "True" : "False";
}

var DESC = 'lorem ipsum';

var testData = {};

var i = 0;

testData.characteristicType = [
    { id: 1, name: 'checkbox', description: randomText() },
    { id: 2, name: 'number', description: randomText() },
    { id: 3, name: 'picklist', description: randomText() },
    { id: 4, name: 'radio', description: randomText() },
    { id: 5, name: 'text', description: randomText() },
    { id: 6, name: 'textarea', description: randomText() }
];

testData.characteristic =  [
    { id: 1, type_id: 5, sort: i++, name: 'Name', description: randomShortText(), tab: "Information" },
    { id: 2, type_id: 6, sort: i++, name: 'Description', description: randomShortText(), tab: "Information"  },
    { id: 3, type_id: 5, sort: i++, name: 'Also Known Us', description: randomShortText(), tab: "Information"   },
    { id: 4, type_id: 5, sort: i++, name: 'Type', description: randomShortText(), tab: "Information"   },
    { id: 5, type_id: 4, sort: i++, name: 'Duration', description: randomShortText(), tab: "Information"   },
    { id: 6, type_id: 2, sort: i++, name: 'Cost', description: randomShortText(), tab: "Information"   },

    { id: 7, type_id: 1, sort: i++, name: 'Public?', description: randomShortText(), tab: "Information"   },
    { id: 8, type_id: 3, sort: i++, name: 'Color', description: randomShortText(), tab: "Information"   },
    { id: 9, type_id: 3, sort: i++, name: 'Size', description: randomShortText(), tab: "How to start"   },
    { id: 10, type_id: 3, sort: i++, name: 'Difficulty', description: randomShortText(), tab: "How to start"   },
    { id: 11, type_id: 4, sort: i++, name: 'Risk', description: randomShortText(), tab: "How to start"   },
    { id: 12, type_id: 5, sort: i++, name: 'POC', description: randomShortText(), tab: "How to start"   }
];


testData.characteristicTypeValue =  [
    { id: 1, characteristic_id: 5, name: "1 Month", value: 'value', description: DESC },
    { id: 2, characteristic_id: 5, name: "3 Months", value: 'value', description: DESC },
    { id: 3, characteristic_id: 5, name: "6 Months", value: 'value', description: DESC },
    { id: 4, characteristic_id: 5, name: "1 Year", value: 'value', description: DESC },

    { id: 5, characteristic_id: 8, name: "Red", value: 'value', description: DESC },
    { id: 6, characteristic_id: 8, name: "Blue", value: 'value', description: DESC },
    { id: 7, characteristic_id: 8, name: "Black", value: 'value', description: DESC },
    { id: 8, characteristic_id: 8, name: "Orange", value: 'value', description: DESC },

    { id: 9, characteristic_id: 9, name: "XS", value: 'value', description: DESC },
    { id: 10, characteristic_id: 9, name: "S", value: 'value', description: DESC },
    { id: 11, characteristic_id: 9, name: "M", value: 'value', description: DESC },
    { id: 12, characteristic_id: 9, name: "L", value: 'value', description: DESC },
    { id: 13, characteristic_id: 9, name: "XL", value: 'value', description: DESC },

    { id: 14, characteristic_id: 10, name: "Easy", value: 'value', description: DESC },
    { id: 15, characteristic_id: 10, name: "Medium", value: 'value', description: DESC },
    { id: 16, characteristic_id: 10, name: "Hard", value: 'value', description: DESC },

    { id: 17, characteristic_id: 11, name: "Low", value: 'value', description: DESC },
    { id: 18, characteristic_id: 11, name: "Average", value: 'value', description: DESC },
    { id: 19, characteristic_id: 11, name: "High", value: 'value', description: DESC }
];

testData.fileUpload =  [
    { id: 1, filename: "test.png", mime: "image/png", path: Path.join(__dirname, "downloads", "test.png")}
];

testData.searchForm =  [
    { id: 1, name: 'Default form', description: DESC, active: true }
];

i = 1;
testData.searchFormField =  [
    //name
    { id: 1, sort: i++, form_id: 1, characteristic_id: 1 },
    //description
    { id: 2, sort: i++, form_id: 1, characteristic_id: 2 },
    //Public?
    { id: 3, sort: i++, form_id: 1, characteristic_id: 7 },
    //Cost
    { id: 4, sort: i++, form_id: 1, characteristic_id: 6 },
    //Color
    { id: 5, sort: i++, form_id: 1, characteristic_id: 8 },
    //Size
    { id: 6, sort: i++, form_id: 1, characteristic_id: 9 }
];


testData.searchFormFieldValue =  [
    { id: 1, field_id: 5, valuetype_id: 5},
    { id: 2, field_id: 5, valuetype_id: 6},
    { id: 3, field_id: 5, valuetype_id: 7},
    { id: 4, field_id: 5, valuetype_id: 8},

    { id: 5, field_id: 6, valuetype_id: 9},
    { id: 6, field_id: 6, valuetype_id: 10},
    { id: 7, field_id: 6, valuetype_id: 11}
];

testData.dashboard = [
    {id: 1, data: {description: "<img src='/img/img-placeholder-6.png' alt='' width='958' />"}}
];

initDb(function (err, db) {
    if (err) {
        throw err;
    }
    //models can be accessed only after data init
    var names = Object.keys(testData);
    async.series([
        function (cb) {
            async.forEachSeries(names, function (name, callback) {
                var model = db.models[name],
                    values = testData[name];
                console.log('inserting: ' + name);
                async.forEachSeries(values, function (value, cb) {
                    model.create(value, cb);
                }, callback);
            }, cb);
        }, function (cb) {
            console.log('generating SMGs');
            async.forEach(_.range(1, smgCount + 1), function (smgId, cb) {
                async.series([
                    function (cb) {
                        db.models.smg.create({
                            id: smgId,
                            name: "name",
                            description: DESC
                        }, cb);
                    }, function (cb) {
                        async.forEach(testData.characteristic, function (characteristic, cb) {
                            var values = {
                                smg_id: smgId,
                                characteristic_id: characteristic.id,
                                valuetype_id: null,
                                value: null,
                                description: DESC
                            };
                            if (characteristic.type_id === 1) {
                                //checkbox
                                values.value = randomCheckbox();
                            }
                            if (characteristic.type_id === 2) {
                                //number
                                values.value = _.random(1, 1000) * 1000;
                            }
                            if (characteristic.type_id === 3 || characteristic.type_id === 4) {
                                //piclist, radio
                                values.valuetype_id = _.chain(testData.characteristicTypeValue)
                                    .filter(function (item) {
                                        return item.characteristic_id === characteristic.id;
                                    })
                                    .sample()
                                    .value()
                                    .id;
                            }
                            if (characteristic.type_id === 5) {
                                //text
                                values.value = moniker.choose();
                            }
                            if (characteristic.type_id === 6) {
                                //textarea
                                values.value = randomText();
                            }
                            db.models.smgCharacteristic.create(values, cb);
                        }, cb);
                    }, function (cb) {
                        async.forEach(_.range(1, examplesPerSmg + 1), function (nr, cb) {
                            db.models.example.create({
                                smg_id: smgId,
                                name: moniker.choose(),
                                description: randomHtml()
                            }, cb);
                        }, cb);
                    }
                ], cb);
            }, cb);
        }, function (cb) {
            console.log('generating HelpTopics');
            async.forEach(_.range(1, helpCount + 1), function (helpId, cb) {
                db.models.helpTopic.create({
                    id: helpId,
                    name: moniker.choose(),
                    description: randomHtml(),
                    image_id: 1
                }, cb);
            }, cb);
        }
    ], function (err) {
        if (err) {
            throw err;
        }
        console.log("DONE");
        process.exit(0);
    });
}, true);