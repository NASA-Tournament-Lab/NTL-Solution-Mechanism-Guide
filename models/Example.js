/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. make example#name optional
 */
"use strict";

var SMG = require('./SMG');
var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var Example = db.define('example', {
            name: types.string,
            type: types.string,
            description: types.string,
            imageId: {type: "number", required: false,  rational: false}
        });
        Example.hasOne('smg', db.models.smg, {reverse: 'examples', required: true});
        Example.collectionName = "Example";
        callback(null, Example);
    },
    //create a foreign key to Example table
    syncSql: ['FK_smg_example.sql']
};