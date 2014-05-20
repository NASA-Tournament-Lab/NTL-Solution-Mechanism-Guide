/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. Upload information is moved to FileUpload model
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var HelpTopic = db.define('helpTopic', {
            name: types.string,
            description: types.string
        });
        HelpTopic.hasOne('image', db.models.fileUpload, {required: true});
        HelpTopic.collectionName = "HelpTopic";
        callback(null, HelpTopic);
    },
    //create a foreign key to FileUpload table
    syncSql: ['FK_help_file.sql']
};

