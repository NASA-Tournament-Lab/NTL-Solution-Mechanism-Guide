/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. make examples#name optional
 * 2. make smg#name and smg#description optional
 * 3. add search2
 */
"use strict";

var async = require('async');
var orm = require('orm');
var _ = require('underscore');
var crudHelper = require('../helpers/crudHelper');
var BadRequestError = require('../errors/BadRequestError');
var helper = require('../helpers/helper');
var wrapExpress = require("../helpers/logging").wrapExpress;
var validate = require("../helpers/validator").validate;

var SMGDefinition_create = {
    name: "string?",
    description: "string?",
    characteristics: [ {characteristic: "id", value: "value"}],
    examples: [{name: "string?", description: "string"}]
};
var SMGDefinition_updateSingle = {
    name: "string?",
    description: "string?",
    characteristics: [ {characteristic: "id", value: "value"}],
    examples: [{name: "string?", description: "string"}]
};
var SMGDefinition_updateBatch = [{
    id: "id",
    name: "string?",
    description: "string?",
    characteristics: [ {characteristic: "id", value: "value"}],
    examples: [{name: "string?", description: "string"}]
}];
var SMGDefinition_search = {name: "string?", description: "string?"};
var SearchDefinition = [{characteristic: "id", value: "value"}];

/**
 * Create a SMGCharacteristic for given smg.
 * @param {Object} db the orm2 database instance
 * @param {Number} smgId the smg id
 * @param {Object} values the values to create
 * @param {Function<err>} callback the callback
 * @private
 */
function _createCharacteristic(db, smgId, values, callback) {
    async.waterfall([
        function (cb) {
            helper.getSingle(values.characteristic, db.models.characteristic, cb);
        },
        function (characteristic, cb) {
            if (_.isArray(values.value)) {
                async.forEach(values.value, function (value, cbx) {
                    helper.getSingle(value, db.models.characteristicTypeValue, function (err, typeValue) {
                        if (err) {
                            cbx(err);
                            return;
                        }
                        if (typeValue.characteristic_id !== characteristic.id) {
                            cbx(new BadRequestError("Given characteristicTypeValue id=" + value + " doesn't belong to" +
                                " characteristic with id=" + characteristic.id));
                            return;
                        }
                        db.models.smgCharacteristic.create({
                            smg_id: smgId,
                            characteristic_id: characteristic.id,
                            valuetype_id: value
                        }, cbx);
                    });
                }, cb);
            } else {
                db.models.smgCharacteristic.create({
                    smg_id: smgId,
                    characteristic_id: values.characteristic,
                    value: values.value
                }, cb);
            }
        }
    ], function (err) {
        callback(err);
    });
}


/**
 * Create a SMG with given values
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
            db.models.smg.create({
                name: values.name,
                description: values.description
            }, cb);
        }, function (entity, cb) {
            result = entity;
            async.forEach(values.characteristics || [], _createCharacteristic.bind(null, db, entity.id), cb);
        }, function (cb) {
            async.forEach(values.examples, function (example, cbx) {
                example.smg_id = result.id;
                db.models.example.create(example, cbx);
            }, cb);
        }, function (cb) {
            helper.populateSMG(result, cb);
        }
    ], function (err) {
        callback(err, result);
    });
}

/**
 * Update a SMG with given values. Previous Examples and SMGCharacteristics are deleted.
 *
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create
 * @param {Function<err, result>} callback the callback function
 * @private
 */
function _update(db, values, callback) {
    var result;
    async.waterfall([
        function (cb) {
            helper.getSingle(values.id, db.models.smg, cb);
        }, function (entity, cb) {
            result = entity;
            var toUpdate = _.pick(values, 'name', 'description');
            entity.save(toUpdate, cb);
        }, function (entity, cb) {
            db.models.example.find({smg_id: result.id}).remove(cb);
        }, function (stat, undef, cb) {
            db.models.smgCharacteristic.find({smg_id: result.id}).remove(cb);
        }, function (stat, undef, cb) {
            async.forEach(values.characteristics || [], _createCharacteristic.bind(null, db, result.id), cb);
        }, function (cb) {
            async.forEach(values.examples, function (example, cbx) {
                example.smg_id = result.id;
                db.models.example.create(example, cbx);
            }, cb);
        }, function (cb) {
            helper.populateSMG(result, cb);
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
    return helper.getPopulateDelegate(callback, helper.populateSMG);
}

/**
 * Retrieve the SMGs. Search criteria is optional.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function index(req, db, callback) {
    _.setNullableIds(req.query);
    crudHelper.filter(req.query, db.models.smg, SMGDefinition_search, _getPopulateDelegate(callback));
}

/**
 * Retrieve a single SMG.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function show(req, db, callback) {
    crudHelper.getSingle(req.params.id, db.models.smg, _getPopulateDelegate(callback));
}

/**
 * Create a SMG.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createSingle(req, db, callback) {
    async.waterfall([
        function (cb) {
            cb(validate(req.body, SMGDefinition_create));
        }, function (cb) {
            _create(db, req.body, cb);
        }
    ], callback);
}

/**
 * Create batch of SMGs.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createBatch(req, db, callback) {
    async.waterfall([
        function (cb) {
            cb(validate(req.body, [SMGDefinition_create]));
        }, function (cb) {
            async.map(req.body, _create.bind(null, db), cb);
        }
    ], callback);
}

/**
 * Update batch of SMGs.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateBatch(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.body, SMGDefinition_updateBatch);
            cb(error);
        }, function (cb) {
            async.map(req.body, _update.bind(null, db), cb);
        }
    ], callback);
}

/**
 * Update a SMG.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateSingle(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.params.id, "stringId", "id") || validate(req.body, SMGDefinition_updateSingle);
            cb(error);
        }, function (cb) {
            req.body.id = Number(req.params.id);
            _update(db, req.body, cb);
        }
    ], callback);
}

/**
 * Remove batch of SMGs.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeBatch(req, db, callback) {
    crudHelper.removeBatch(req.body, db.models.smg, callback);
}

/**
 * Remove a SMG.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeSingle(req, db, callback) {
    crudHelper.removeSingle(req.params.id, db.models.smg, callback);
}


/**
 * Search SMG by search criteria.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function search(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.body, SearchDefinition);
            cb(error);
        }, function (cb) {
            var conditions = _.map(req.body, function (field) {
                if (_.isArray(field.value)) {
                    return {
                        or: _.map(field.value, function (v) {
                            return {
                                characteristic_id: field.characteristic,
                                valuetype_id: v
                            };
                        })
                    };
                }
                return {
                    characteristic_id: field.characteristic,
                    value: orm.like("%" + field.value + "%")
                };
            });

            //we must exec query: conditions[0] AND conditions[1] AND ...
            //we exec for each item SMGCharacteristic.find(conditions[i]) and find intersection
            async.map(conditions, function (condition, cbx) {
                db.models.smgCharacteristic.find(condition).only('smg_id').run(cbx);
            }, cb);
        }, function (results, cb) {
            //results is something like [[{smg_id:1}, {smg_id:2}], [{smg_id:3}, {smg_id:3}, {smg_id:1}]]
            var arrayOfIds, ids;
            arrayOfIds = _.map(results, function (item) {
                return _.chain(item).pluck("smg_id").unique().value();
            });
            //arrayOfIds is [ [1,2], [3, 1] ]
            ids = _.intersection.apply(_, arrayOfIds);
            //ids is [1]

            db.models.smg.find({id: ids}, cb);
        }, function (smgs, cb) {
            async.map(smgs, helper.populateSMG, cb);
        }
    ], callback);
}

/**
 * Search SMG by search criteria (GET version).
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function search2(req, db, callback) {
    var criteria;
    try {
        criteria = JSON.parse(req.query.criteria);
    } catch (e) {
        callback(new BadRequestError("invalid criteria"));
        return;
    }
    req.body = criteria;
    search(req, db, callback);
}


module.exports = {
    index: wrapExpress("SMG#index", index),
    show: wrapExpress("SMG#show", show),
    createBatch: wrapExpress("SMG#createBatch", createBatch),
    createSingle: wrapExpress("SMG#createSingle", createSingle),
    updateSingle: wrapExpress("SMG#updateSingle", updateSingle),
    updateBatch: wrapExpress("SMG#updateBatch", updateBatch),
    removeSingle: wrapExpress("SMG#removeSingle", removeSingle),
    removeBatch: wrapExpress("SMG#removeBatch", removeBatch),
    search: wrapExpress("SMG#search", search),
    search2: wrapExpress("SMG#search2", search2)
};