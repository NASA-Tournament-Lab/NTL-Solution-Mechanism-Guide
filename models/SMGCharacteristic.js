/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var types = require("../helpers/dbTypes");

module.exports = {
    init : function (db, callback) {
        var SMGCharacteristic = db.define('smgCharacteristic', {
            value: types.optional_string
        });
        SMGCharacteristic.hasOne('smg', db.models.smg, {required: true, reverse: 'smgCharacteristics'});
        SMGCharacteristic.hasOne('characteristic', db.models.characteristic, {required: true});
        SMGCharacteristic.hasOne('valueType', db.models.characteristicTypeValue, {required: false});
        SMGCharacteristic.collectionName = "SMGCharacteristic";
        callback(null, SMGCharacteristic);
    },
    //create a foreign key to SMG, Characteristic, CharacteristicType tables
    syncSql: ["FK_smg-c_smg.sql", "FK_smg-c_c.sql", "FK_smg-c_ctv.sql"]
};
