/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add 'seed' parameter. It inserts required data for frontend app.
 */
"use strict";

/**
 * Run this script to recreate all tables. DB will be empty.
 */
var fs = require('fs');
var async = require('async');
var initDb = require('./db');

initDb(function (err, db) {
    if (err) {
        throw err;
    }
    if (process.argv[2] === "seed") {
        async.series([
            function (cb) {
                db.driver.execQuery(fs.readFileSync(__dirname + "/sql/seed/characteristic_types.sql", 'utf8'), cb);
            }, function (cb) {
                db.driver.execQuery(fs.readFileSync(__dirname + "/sql/seed/characteristics.sql", 'utf8'), cb);
            }
        ], function (err) {
            if (err) {
                throw err;
            }
            console.log("ok");
            process.exit(0);
        });
    } else {
        console.log("ok");
        process.exit(0);
    }
}, true);