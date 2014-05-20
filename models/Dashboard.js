/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var types = require("../helpers/dbTypes");


module.exports = {
    init : function (db, callback) {
        var Dashboard = db.define('dashboard', {
            data: {type: "object", required: true}
        });
        Dashboard.collectionName = "Dashboard";
        callback(null, Dashboard);
    }
};

