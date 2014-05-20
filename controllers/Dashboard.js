/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var async = require('async');
var wrapExpress = require("../helpers/logging").wrapExpress;

/**
 * Get dashboard data or empty object if not set
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function getDashboard(req, db, callback) {
    db.models.dashboard.one({}, function (err, ret) {
        callback(err, ret ? ret.data : {});
    });
}

/**
 * Update dashboard
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function update(req, db, callback) {
    async.waterfall([
        function (cb) {
            db.models.dashboard.find({}).remove(function (err) {
                cb(err);
            });
        }, function (cb) {
            db.models.dashboard.create({data: req.body}, cb);
        }
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result.data);
        }
    });
}



module.exports = {
    getDashboard: wrapExpress("Dashboard#getDashboard", getDashboard),
    update: wrapExpress("Dashboard#update", update)
};