/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

/**
 * Run this script to recreate all tables and insert test data for real frontend application.
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
    { id: 1, group: 3, name: 'checkbox', description: randomText() },
    { id: 2, group: 4, name: 'number', description: randomText() },
    { id: 3, group: 2, name: 'picklist', description: randomText() },
    { id: 4, group: 2, name: 'radio', description: randomText() },
    { id: 5, group: 1, name: 'text', description: randomText() },
    { id: 6, group: 1, name: 'textarea', description: randomText() },
    { id: 7, group: -1, name: 'image', description: randomText() }
];


/**
 * Base characteristic Ids that cannot be removed used in public/app.js
 */
/*var chIds = {
    name: 1,
    desc: 2,
    aka: 3,
    image: 4,
    duration: 5,
    cost: 6
};*/
testData.characteristic =  [
    { id: 1, type_id: 5, sort: i++, name: 'Solution Mechanism Name', description: "Name of the Solution Mechanism", tab: "Information", blockDelete: true },
    { id: 2, type_id: 6, sort: i++, name: 'Brief Description', description: "A brief description of the Solution Mechanism", tab: "Information", blockDelete: true },
    { id: 3, type_id: 5, sort: i++, name: 'Other Known Names', description: "Other known acronyms or names for the Solution Mechanism that are often used", tab: "Information", blockDelete: true },
    { id: 4, type_id: 7, sort: i++, name: 'Graphics', description: "Images or visuals that are relevant to the Solution Mechanism", tab: "How to start"   },
    { id: 5, type_id: 3, sort: i++, name: 'Duration of Solution Mechanism', description: "Time expectations related to each phase of the Solution Mechanism", tab: "Information"   },
    { id: 6, type_id: 2, sort: i++, name: 'Cost of Solution Mechanism', description: "Associated monetary costs for the Solution Mechanism", tab: "How to start"   },
    { id: 7, type_id: 6, sort: i++, name: 'More Information', description: "More relevant information and details about the Solution Mechanism", tab: "Information", blockDelete: true },
    { id: 8, type_id: 3, sort: i++, name: 'Deliverable Type', description: "What deliverable can be expected from using the Solution Mechanism ", tab: "Information", blockDelete: true },
    { id: 9, type_id: 5, sort: i++, name: 'Kickoff Restrictions for Solution Mechanism', description: "Deadline or kickoff restrictions for the Solution Mechanism", tab: "Information", blockDelete: true },
    { id: 10, type_id: 5, sort: i++, name: 'Relevant Links and Guidance', description: "Website links that can provide more information", tab: "Information", blockDelete: true },
    { id: 11, type_id: 5, sort: i++, name: 'Examples', description: "Follow current structure (name, description, ability to add visuals/attachments/links)", tab: "Information", blockDelete: true },
    { id: 12, type_id: 5, sort: i++, name: 'Point of Contact (POC): Name and Email Address', description: "Point of Contact (POC): Name and Email Address", tab: "Information"   },
    { id: 13, type_id: 3, sort: i++, name: 'Time Investment', description: "Expected time investment for the Technical POC and Solution Mechanism POC for each phase of the Solution Mechanism", tab: "How to start"   },
    { id: 14, type_id: 3, sort: i++, name: 'Solution Mechanism Metrics', description: "Metrics", tab: "How to start"   },
    { id: 15, type_id: 5, sort: i++, name: 'Repository', description: "Site where data for the Solution Mechanism", tab: "How to start"   },
    { id: 16, type_id: 7, sort: i++, name: 'Attachments', description: "Attachments", tab: "How to start"   }
];


testData.characteristicTypeValue =  [
    //Deliverable Type
    { id: 1, characteristic_id: 8, name: "Knowledge", value: 'Knowledge', description: DESC },
    { id: 2, characteristic_id: 8, name: "Countermeasures", value: 'Countermeasures', description: DESC },
    { id: 3, characteristic_id: 8, name: "Controls", value: 'Controls', description: DESC },
    { id: 4, characteristic_id: 8, name: "Technology", value: 'Technology', description: DESC },
    { id: 5, characteristic_id: 8, name: "Guidelines", value: 'Guidelines', description: DESC },
    { id: 6, characteristic_id: 8, name: "Standards", value: 'Standards', description: DESC },
    { id: 7, characteristic_id: 8, name: "Requirements", value: 'Requirements', description: DESC },
    //Duration of Solution Mechanism
    { id: 8, characteristic_id: 5, name: "Prep", value: 'Prep', description: DESC },
    { id: 9, characteristic_id: 5, name: "Time to Execute", value: 'Time to Execute', description: DESC },
    { id: 10, characteristic_id: 5, name: "Agreement Duration", value: 'Agreement Duration', description: DESC },
    //Time Investment
    { id: 11, characteristic_id: 13, name: "Prep", value: 'Prep', description: DESC },
    { id: 12, characteristic_id: 13, name: "Time to Execute", value: 'Time to Execute', description: DESC },
    { id: 13, characteristic_id: 13, name: "Agreement Duration", value: 'Agreement Duration', description: DESC },
    //Solution Mechanism Metrics
    { id: 14, characteristic_id: 14, name: "In Prep", value: 'In Prep', description: DESC },
    { id: 15, characteristic_id: 14, name: "Active", value: 'Active', description: DESC },
    { id: 16, characteristic_id: 14, name: "Expired", value: 'Expired', description: DESC },
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
    //Cost
    { id: 3, sort: i++, form_id: 1, characteristic_id: 6 },
    //Other Known Names
    { id: 4, sort: i++, form_id: 1, characteristic_id: 3 },
    //Duration of Solution Mechanism
    { id: 5, sort: i++, form_id: 1, characteristic_id: 5 },
    //Solution Mechanism Metrics
    { id: 6, sort: i++, form_id: 1, characteristic_id: 14 }
];


testData.searchFormFieldValue =  [
    { id: 1, field_id: 5, valuetype_id: 8},
    { id: 2, field_id: 5, valuetype_id: 9},
    { id: 3, field_id: 5, valuetype_id: 10},

    { id: 4, field_id: 6, valuetype_id: 14},
    { id: 5, field_id: 6, valuetype_id: 15},
    { id: 6, field_id: 6, valuetype_id: 16}
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
                            if (characteristic.type_id === 7) {
                                //image
                                values.value = 1;
                            }
                            db.models.smgCharacteristic.create(values, cb);
                        }, cb);
                    }, function (cb) {
                        async.forEach(_.range(1, examplesPerSmg + 1), function (nr, cb) {
                            db.models.example.create({
                                imageId: 1,
                                smg_id: smgId,
                                name: moniker.choose(),
                                type: _.sample(["type1", "type2", "type3", "type4"]),
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