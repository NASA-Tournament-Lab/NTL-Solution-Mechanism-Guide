/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add property 'tab' to characteristics. Tab is optional field. Sort & Tab must be unique values.
 * 2. remove checkUniqueSort. Db error is returned if UQ failed.
 * 3. Characteristic#values fields 'value' and 'description' are optional
 * 4. Populate entity/entities in create and update methods
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var crudHelper = require('../helpers/crudHelper');
var helper = require('../helpers/helper');
var wrapExpress = require("../helpers/logging").wrapExpress;
var validate = require("../helpers/validator").validate;

var ValueDefinition = {type: [{name: "string", description: "string?", value: "string?"}], required: false };
var TabDefinition = {type: "string", maxLength: 30, required: false};

var Definition = {name: "string", description: "string", type_id: "id", sort: "int+", values: ValueDefinition, tab: TabDefinition};
var Definition_updateSingle = {name: "string?", description: "string?", type_id: "id?", sort: "int+?", values: ValueDefinition, tab: TabDefinition};
var Definition_updateBatch = [{id: "id", name: "string?", description: "string?", type_id: "id?", sort: "int+?", values: ValueDefinition, tab: TabDefinition}];
var Definition_search = {name: "string?", description: "string?", type_id: "stringId?", sort: "stringInt+?", tab: TabDefinition};


/**
 * Create a Characteristic with given values
 *
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create
 * @param {Function<err, result>} callback the callback function
 * @private
 */
function _create(db, values, callback) {
    var result;
    async.waterfall([
        function (cb) {
            helper.checkCanCreateCharacteristic(db, values, cb);
        }, function (cb) {
            var toCreate = _.pick(values, "name", "description", "type_id", "sort", "tab");
            db.models.characteristic.create(toCreate, cb);
        }, function (characteristic, cb) {
            result = characteristic;
            async.forEach(values.values || [], function (v, cbx) {
                v.characteristic_id = characteristic.id;
                db.models.characteristicTypeValue.create(v, cbx);
            }, cb);
        }, function (cb) {
            result.getValues(cb);
        }
    ], function (err) {
        callback(err, result);
    });
}


/**
 * Update a Characteristic with given values
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create
 * @param {Function<err, result>} callback the callback function
 * @private
 */
function _update(db, values, callback) {
    var result;
    async.waterfall([
        function (cb) {
            helper.checkCanUpdateCharacteristic(db, values.id, values, cb);
        }, function (cb) {
            helper.getSingle(values.id, db.models.characteristic, cb);
        }, function (entity, cb) {
            result = entity;
            var toUpdate = _.pick(values, "name", "description", "type_id", "sort", "tab");
            result.save(toUpdate, cb);
        }, function (entity, cb) {
            db.models.characteristicTypeValue.find({characteristic_id: values.id}).remove(cb);
        }, function () {
            var cb = arguments[arguments.length - 1];
            async.forEach(values.values || [], function (v, cbx) {
                v.characteristic_id = result.id;
                db.models.characteristicTypeValue.create(v, cbx);
            }, cb);
        }, function (cb) {
            result.getValues(cb);
        }
    ], function (err) {
        callback(err, result);
    });
}

/**
 * Get a function delegate that populate results and call original callback.
 * @param {Function} callback to wrap.
 * @returns {Function} the wrapped function
 * @private
 */
function _getPopulateDelegate(callback) {
    return helper.getPopulateDelegate(callback, helper.populateCharacteristic);
}

/**
 * Retrieve the Characteristics. Search criteria is optional.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function index(req, db, callback) {
    _.setNullableIds(req.query);
    crudHelper.filter(req.query, db.models.characteristic, Definition_search, _getPopulateDelegate(callback));
}

/**
 * Retrieve a single Characteristic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function show(req, db, callback) {
    crudHelper.getSingle(req.params.id, db.models.characteristic, _getPopulateDelegate(callback));
}

/**
 * Create a Characteristic or batch of Characteristics.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createSingle(req, db, callback) {
    async.waterfall([
        function (cb) {
            cb(validate(req.body, Definition));
        }, function (cb) {
            _create(db, req.body, cb);
        }
    ], _getPopulateDelegate(callback));
}

/**
 * Create a Characteristic or batch of Characteristics.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createBatch(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.body, [Definition]);
            cb(error);
        }, function (cb) {
            async.map(req.body, _create.bind(null, db), cb);
        }
    ], _getPopulateDelegate(callback));
}

/**
 * Update batch of Characteristics.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateBatch(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.body, Definition_updateBatch);
            cb(error);
        }, function (cb) {
            async.map(req.body, _update.bind(null, db), cb);
        }
    ], _getPopulateDelegate(callback));
}

/**
 * Update a Characteristic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateSingle(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.params.id, "stringId") || validate(req.body, Definition_updateSingle);
            cb(error);
        }, function (cb) {
            req.body.id = Number(req.params.id);
            _update(db, req.body, cb);
        }
    ], _getPopulateDelegate(callback));
}


/**
 * Remove batch of Characteristics.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeBatch(req, db, callback) {
    crudHelper.removeBatch(req.body,
        db.models.characteristic,
        helper.checkCanDeleteCharacteristic.bind(null, db),
        callback);
}

/**
 * Remove a Characteristic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeSingle(req, db, callback) {
    crudHelper.removeSingle(req.params.id,
        db.models.characteristic,
        helper.checkCanDeleteCharacteristic.bind(null, db),
        callback);
}


module.exports = {
    index: wrapExpress("Characteristic#index", index),
    show: wrapExpress("Characteristic#show", show),
    createSingle: wrapExpress("Characteristic#createSingle", createSingle),
    createBatch: wrapExpress("Characteristic#createBatch", createBatch),
    updateSingle: wrapExpress("Characteristic#updateSingle", updateSingle),
    updateBatch: wrapExpress("Characteristic#updateBatch", updateBatch),
    removeSingle: wrapExpress("Characteristic#removeSingle", removeSingle),
    removeBatch: wrapExpress("Characteristic#removeBatch", removeBatch)
};