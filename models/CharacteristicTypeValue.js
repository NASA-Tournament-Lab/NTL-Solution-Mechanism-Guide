/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_
 * changes in 1.1:
 * 1. make value and description optional
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var CharacteristicTypeValue = db.define('characteristicTypeValue', {
            name: types.string,
            description: types.optional_string,
            value: types.optional_string
        });
        CharacteristicTypeValue.hasOne('characteristic', db.models.characteristic, {required: true, reverse: 'values'});
        CharacteristicTypeValue.collectionName = "CharacteristicTypeValue";
        callback(null, CharacteristicTypeValue);
    },
    //create a foreign key to CharacteristicType table
    //syncSql: "FK_ctv_c.sql"
};