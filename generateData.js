/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

/**
 * Run this script to recreate all tables and insert test data.
 */

var async = require('async');
var initDb = require('./db');
var config = require('./config/configuration');

var DESC = 'lorem ipsum';

var testData = {
    smg: [
        { id: 1, name: 'Secret solution', description: DESC },
        { id: 2, name: 'TC solution', description: DESC },
        { id: 3, name: 'Cloudspoke solution', description: DESC }
    ],
    example: [
        { id: 1, smg_id: 1, name: 'ABC Example 1', description: DESC },
        { id: 2, smg_id: 1, name: 'ABC Example 2', description: DESC },
        { id: 3, smg_id: 1, name: 'ABC Example 3', description: DESC },
        { id: 4, smg_id: 2, name: 'XYZ Example 1', description: DESC },
        { id: 5, smg_id: 2, name: 'XYZ Example 2', description: DESC }
    ],
    characteristicType: [
        { id: 1, name: 'text', description: DESC },
        { id: 2, name: 'piclist', description: DESC },
        { id: 3, name: 'multiple', description: DESC }
    ],
    characteristic: [
        { id: 1, type_id: 1, sort: 0, name: 'Summary', description: DESC },
        { id: 2, type_id: 2, sort: 1, name: 'Deliverable Type', description: DESC },
        { id: 3, type_id: 3, sort: 2, name: 'Tags', description: DESC }
    ],
    characteristicTypeValue: [
        { id: 1, characteristic_id: 2, name: "name", value: 'Knowledge', description: DESC },
        { id: 2, characteristic_id: 2, name: "name", value: 'Technology', description: DESC },

        { id: 3, characteristic_id: 3, name: "name", value: 'Red', description: DESC },
        { id: 4, characteristic_id: 3, name: "name", value: 'White', description: DESC },
        { id: 5, characteristic_id: 3, name: "name", value: 'Black', description: DESC },
        { id: 6, characteristic_id: 3, name: "name", value: 'Yellow', description: DESC }
    ],

    smgCharacteristic: [
    /**
     * SMG 1:
     * Summary: 'ok',
     * Deliverable Type: Knowledge
     * Tags: Red, White
     */
        { id: 1, smg_id: 1, characteristic_id: 1, valuetype_id: null, value: "ok", description: DESC },
        { id: 2, smg_id: 1, characteristic_id: 2, valuetype_id: 1, value: null, description: DESC },
        { id: 3, smg_id: 1, characteristic_id: 3, valuetype_id: 3, value: null, description: DESC },
        { id: 4, smg_id: 1, characteristic_id: 3, valuetype_id: 4, value: null, description: DESC },

    /**
     * SMG 2:
     * Summary: 'bad',
     * Deliverable Type: Technology
     * Tags: Black
     */
        { id: 5, smg_id: 2, characteristic_id: 1, valuetype_id: null, value: "bad", description: DESC },
        { id: 6, smg_id: 2, characteristic_id: 2, valuetype_id: 2, value: null, description: DESC },
        { id: 7, smg_id: 2, characteristic_id: 3, valuetype_id: 5, value: null, description: DESC },

    /**
     * SMG 3:
     * Summary: 'unknown',
     * Deliverable Type: Technology
     * Tags: Black, Yellow
     */
        { id: 8, smg_id: 3, characteristic_id: 1, valuetype_id: null, value: "unknown", description: DESC },
        { id: 9, smg_id: 3, characteristic_id: 2, valuetype_id: 2, value: null, description: DESC },
        { id: 10, smg_id: 3, characteristic_id: 3, valuetype_id: 5, value: null, description: DESC },
        { id: 11, smg_id: 3, characteristic_id: 3, valuetype_id: 6, value: null, description: DESC }
    ],

    searchForm: [
        //FORM#1
        { id: 1, name: 'Summary: OK', description: DESC, active: true },
        //FORM#2
        { id: 2, name: 'Deliverable Type: Technology', description: DESC },
        //FORM#3
        { id: 3, name: 'Tags: Black', description: DESC },
        //FORM#4
        { id: 4, name: 'Tags: Black or White', description: DESC },
        //FORM#5
        { id: 5, name: 'Tags: Red and White', description: DESC },
        //FORM#6
        { id: 6, name: 'Tags: Yellow AND Deliverable Type: Technology', description: DESC }
    ],
    searchFormField: [
        //FORM#1
        { id: 1, sort: 0, form_id: 1, characteristic_id: 1 },
        //FORM#2
        { id: 2, sort: 0, form_id: 2, characteristic_id: 2 },
        //FORM#3
        { id: 3, sort: 0, form_id: 3, characteristic_id: 3 },
        //FORM#4
        { id: 4, sort: 0, form_id: 4, characteristic_id: 3 },
        //FORM#5
        { id: 5, sort: 0, form_id: 5, characteristic_id: 3 },
        { id: 6, sort: 1, form_id: 5, characteristic_id: 3 },
        //FORM#6
        { id: 7, sort: 0, form_id: 6, characteristic_id: 2 },
        { id: 8, sort: 1, form_id: 6, characteristic_id: 3 }
    ],
    searchFormFieldValue: [
        //FORM#1
        { id: 1, field_id: 1, value: "OK", valuetype_id: null},
        //FORM#2
        { id: 2, field_id: 2, value: null, valuetype_id: 2},
        //FORM#3
        { id: 3, field_id: 3, value: null, valuetype_id: 5},
        //FORM#4
        { id: 4, field_id: 4, value: null, valuetype_id: 5},
        { id: 5, field_id: 4, value: null, valuetype_id: 3},
        //FORM#5
        { id: 6, field_id: 5, value: null, valuetype_id: 3},
        { id: 7, field_id: 6, value: null, valuetype_id: 4},
        //FORM#6
        { id: 8, field_id: 7, value: null, valuetype_id: 2},
        { id: 9, field_id: 8, value: null, valuetype_id: 6}
    ]
};

initDb(function (err, db) {
    if (err) {
        throw err;
    }
    //models can be accessed only after data init
    var names = Object.keys(testData);
    async.forEachSeries(names, function (name, callback) {
        var model = db.models[name],
            values = testData[name];
        console.log('inserting: ' + name);
        async.forEachSeries(values, function (value, cb) {
            model.create(value, cb);
        }, callback);
    }, function (err) {
        if (err) {
            throw err;
        }
        console.log("DONE");
        process.exit(0);
    });
}, true);