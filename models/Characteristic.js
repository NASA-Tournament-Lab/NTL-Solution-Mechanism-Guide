/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add 'tab' property
 */
"use strict";

var types = require("../helpers/dbTypes");

module.exports = {
    init : function (db, callback) {
        var Characteristic = db.define('characteristic', {
            name: types.string,
            description: types.string,
            tab: {type: "text", required: true,  size: 30, defaultValue: "default"},

            //UNIQUE constraint is set manually in sql file UC_c_sort.sql
            //because of this bug https://github.com/dresende/node-orm2/issues/326
            sort: types.int
        });
        Characteristic.hasOne('type', db.models.characteristicType, {required: true});
        Characteristic.collectionName = "Characteristic";
        callback(null, Characteristic);
    },
    //create a foreign key to CharacteristicType table
    syncSql: ["FK_c_ct.sql", "UC_c_sort.sql"]
};
