/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. make examples#name optional
 * 2. make smg#name and smg#description optional
 */
"use strict";

var types = require("../helpers/dbTypes");
module.exports = {
    init : function (db, callback) {
        var SMG = db.define('smg', {
            name: types.optional_string,
            description: types.optional_string
        });
        SMG.collectionName = "SMG";
        callback(null, SMG);
    }
};