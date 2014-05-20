/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var FileUpload = db.define('fileUpload', {
            path: types.string,
            filename: types.string,
            mime: types.string
        });
        FileUpload.collectionName = "FileUpload";
        callback(null, FileUpload);
    }
};

