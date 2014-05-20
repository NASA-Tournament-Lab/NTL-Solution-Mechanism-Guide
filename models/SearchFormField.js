/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var SearchFormField = db.define('searchFormField', {
            //UNIQUE constraint is set manually in sql file UC_sff_sort.sql
            //because of this bug https://github.com/dresende/node-orm2/issues/326
            //sort + form_id are unique, not only sort
            sort: types.int
        });
        SearchFormField.hasOne('form', db.models.searchForm, {required: true, reverse: "fields"});
        SearchFormField.hasOne('characteristic', db.models.characteristic, {required: true});
        SearchFormField.collectionName = "SearchFormField";
        callback(null, SearchFormField);
    },
    //create a foreign key to Characteristic and SearchForm table
    syncSql: ["FK_sff_c.sql", "FK_sff_sf.sql", "UC_sff_sort.sql"]
};
