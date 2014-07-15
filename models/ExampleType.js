/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_, TCSASSEMBLER
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var ExampleType = db.define('exampleType', {
            name: types.string
        });
        ExampleType.collectionName = "ExampleType";
        callback(null, ExampleType);
    }
};