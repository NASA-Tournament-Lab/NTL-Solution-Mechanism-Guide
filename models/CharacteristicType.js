/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var CharacteristicType = db.define('characteristicType', {
            name: types.string,
            description: types.string,
            group: types.int
        });
        CharacteristicType.collectionName = "CharacteristicType";
        callback(null, CharacteristicType);
    }
};