/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var SearchFormFieldValue = db.define('searchFormFieldValue', {
            value: types.optional_string
        });
        SearchFormFieldValue.hasOne('field', db.models.searchFormField, {required: true, reverse: 'values'});
        SearchFormFieldValue.hasOne('valueType', db.models.characteristicTypeValue, {required: false});
        SearchFormFieldValue.collectionName = "SearchFormFieldValue";
        callback(null, SearchFormFieldValue);
    },
    //create a foreign key to SearchFormField and CharacteristicTypeValue table
    syncSql: ["FK_sffv_sff.sql", "FK_sffv_ctv.sql"]
};