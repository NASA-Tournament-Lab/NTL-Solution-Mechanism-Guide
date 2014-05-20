/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var SearchForm = db.define('searchForm', {
            name: types.string,
            description: types.string,
            active: {type: "boolean", required: true, defaultValue: false}
        });
        SearchForm.collectionName = "SearchForm";
        callback(null, SearchForm);
    }
};
