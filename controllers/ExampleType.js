/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_, TCSASSEMBLER
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var crudHelper = require('../helpers/crudHelper');
var helper = require('../helpers/helper');
var wrapExpress = require("../helpers/logging").wrapExpress;
var validate = require("../helpers/validator").validate;
var BadRequestError = require("../errors/BadRequestError");

var Definition = {name: "string" };
var DefinitionUpdate = [{name: "string", id: "id?"}];

/**
 * Retrieve the ExampleTypes.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function index(req, db, callback) {
    crudHelper.filter(req.query, db.models.exampleType, {}, callback);
}

/**
 * Create a ExampleType.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createSingle(req, db, callback) {
    crudHelper.createSingleOrBatch(req.body, db.models.exampleType, Definition, callback);
}

/**
 * Update natch of ExampleTypes.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateBatch(req, db, callback) {
    var error = validate(req.body, DefinitionUpdate);
    if (error) {
        callback(error);
        return;
    }
    async.waterfall([
        function (cb) {
            db.models.exampleType.find({}, cb);
        }, function (currentValues, cb) {
            var val2Id = {};
            currentValues.forEach(function (v) {
                val2Id[v.id] = v;
            });
            async.parallel({
                create: function (cbx) {
                    var newValues = _.filter(req.body, function (v) {
                        return !v.id;
                    });
                    db.models.exampleType.create(newValues, cbx);
                },
                update: function (cbx) {
                    var updateValues = _.filter(req.body, function (v) {
                        return v.id;
                    });
                    async.forEach(updateValues, function (v, cbk) {
                        var current = val2Id[v.id];
                        if (!current) {
                            cbk(new BadRequestError("ExampleType with id=" + v.id + " not found"));
                            return;
                        }
                        current.save(v, cbk);
                    }, cbx);
                },
                remove: function (cbx) {
                    var updatedValues = _.pluck(req.body, "id");
                    var toRemove = _.filter(currentValues, function (v) {
                        return updatedValues.indexOf(v.id) == -1;
                    });
                    async.forEach(toRemove, function (v, cbk) {
                        v.remove(cbk);
                    }, cbx);
                }
            }, cb);
        }, function (results, cb) {
            db.models.exampleType.find({}, cb);
        }
    ], callback);
}


module.exports = {
    index: wrapExpress("ExampleType#index", index),
    createSingle: wrapExpress("ExampleType#createSingle", createSingle),
    updateBatch: wrapExpress("ExampleType#updateBatch", updateBatch)
};