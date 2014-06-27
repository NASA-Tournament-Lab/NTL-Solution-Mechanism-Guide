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
var groupMigrate = require("../helpers/groupMigrate");
var BadRequestError = require("../errors/BadRequestError");

var ValueDefinition = {type: [{name: "string", description: "string?", value: "string?", id: "id?"}], required: false };
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
 * Fix all smgCharacteristic and set valueType_id to first value of associated Characteristic.
 * This function should be called when we delete CharacteristicValueType which is associated with SMG
 * @param {Object} db the database object
 * @param {Number} characteristicId the characteristic id
 * @param {Function<err>} callback the callback function
 * @private
 */
function _fixSMGCharacteristcs(db, characteristicId, callback) {
    var value;
    async.waterfall([
        function (cb) {
            db.models.characteristicTypeValue.find({characteristic_id: characteristicId}, cb);
        }, function (values, cb) {
            //don't fix if there is no values
            if (values.length === 0) {
                callback();
                return;
            }
            value = values[0];
            db.models.smgCharacteristic.find({valuetype_id: null, characteristic_id: characteristicId}, cb);
        }, function (smgs, cb) {
            async.forEach(smgs, function (smg, cbx) {
                smg.valuetype_id = value.id;
                smg.save(cbx);
            }, cb);
        }
    ], function (err) {
        callback(err);
    })
}

/**
 * Update CharacteristicTypeValues for given characteristic
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create
 * @param {Number} characteristicId the characteristic id
 * @param {Function<err} callback
 * @private
 */
function _updateTypeValues(db, values, characteristicId, callback) {
    var val2Id = {};
    async.waterfall([
        function (cb) {
            db.models.characteristicTypeValue.find({characteristic_id: characteristicId}, cb);
        }, function (currentValues, cb) {
            currentValues.forEach(function (v) {
                val2Id[v.id] = v;
            });
            async.parallel({
                create: function (cbx) {
                    var newValues = _.filter(values.values, function (v) {
                        return !v.id;
                    });
                    db.models.characteristicTypeValue.create(newValues, cbx);
                },
                update: function (cbx) {
                    var updateValues = _.filter(values.values, function (v) {
                        return v.id;
                    });
                    async.forEach(updateValues, function (v, cbk) {
                        var current = val2Id[v.id];
                        if (!current) {
                            cbk(new BadRequestError("CharacteristicTypeValue with id=" + v.id +
                                " not found for characteristic with id=" + values.id));
                            return;
                        }
                        current.save(v, cbk);
                    }, cbx);
                },
                remove: function (cbx) {
                    var updatedValues = _.pluck(values.values, "id");
                    var toRemove = _.filter(currentValues, function (v) {
                        return updatedValues.indexOf(v.id) == -1;
                    });
                    async.forEach(toRemove, function (v, cbk) {
                        v.remove(cbk);
                    }, cbx);
                }
            }, cb);
        }
    ], function (err) {
        callback(err);
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
    var result, oldGroup, isGroupMigrate = false;
    if (!values.values) {
        values.values = [];
    }
    values.values.forEach(function (v) {
        v.characteristic_id = values.id;
    });
    async.waterfall([
        function (cb) {
            helper.getSingle(values.id, db.models.characteristic, cb);
        }, function (entity, cb) {
            result = entity;
            helper.getSingle(result.type_id, db.models.characteristicType, cb);
        }, function (type, cb) {
            oldGroup = type.group;
            var toUpdate = _.pick(values, "name", "description", "type_id", "sort", "tab");
            result.save(toUpdate, cb);
        }, function (ret, cb) {
            helper.getSingle(values.type_id, db.models.characteristicType, cb);
        }, function (type, cb) {
            if (oldGroup !== type.group) {
                isGroupMigrate = true;
                if (result.blockDelete) {
                    callback(new BadRequestError("Cannot change group for this characteristic"));
                    return;
                }
                async.waterfall([
                    function (cbx) {
                        //perform full update only when change between radio/picklist <=> checkbox
                        if ((oldGroup == 2 && type.group == 3) || (oldGroup == 3 && type.group == 2)) {
                            _updateTypeValues(db, values, values.id, function (err) {
                                cbx(err, null);
                            });
                        } else {
                            //this should be always new values when changing from non-multiple values type to multiple values type
                            //example: checkbox -> listpic, textbox -> radio
                            db.models.characteristicTypeValue.create(values.values, cbx);
                        }
                    }, function (res, cbx) {
                        groupMigrate(db, result.id, oldGroup, type.group, cbx);
                    }
                ], cb);
            } else {
                cb();
            }
        }, function (cb) {
            if (isGroupMigrate) {
                //ignore edit of values if group has changed
                cb();
                return;
            }
            _updateTypeValues(db, values, values.id, cb);
        }, function (cb) {
            _fixSMGCharacteristcs(db, values.id, cb);
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
 * Check if update of Characteristic will affect SMGCharacteristic values.
 * It will affect only if some CharacteristicTypeValue are deleted.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function checkWillAffectSMG(req, db, callback) {
    var characteristic, id = Number(req.params.id);
    async.waterfall([
        function (cb) {
            var error = validate(req.params.id, "stringId") || validate(req.body, Definition_updateSingle);
            cb(error);
        }, function (cb) {
            helper.getSingle(id, db.models.characteristic, cb);
        }, function (result, cb) {
            characteristic = result;
            characteristic.getType(cb);
        }, function (type, cb) {
            helper.getSingle(req.body.type_id, db.models.characteristicType, cb);
        }, function (type, cb) {
            if (type.group != characteristic.type.group) {
                callback(null, {affect: false, groupChange: true, values: []});
                return;
            }
            characteristic.getValues(cb);
        }, function (values, cb) {
            var ids = _.pluck(values, "id");
            var updatedIds = _.chain(req.body.values).pluck("id").compact().value();
            var diff = _.difference(ids, updatedIds);
            if (diff.length == 0) {
                callback(null, {affect: false, values: []});
                return;
            }
            db.models.smgCharacteristic.find({valuetype_id: diff}, cb);
        }, function (smgs, cb) {
            if (smgs.length == 0) {
                cb(null, {affect: false, values: []});
                return;
            }
            var id2Type = {};
            characteristic.values.forEach(function (v) {
                id2Type[v.id] = v.name;
            });
            var values = _.map(smgs, function (smg) {
                return id2Type[smg.valuetype_id];
            });
            cb(null, {affect: true, values: _.unique(values)});
        }
    ], callback);
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
    removeBatch: wrapExpress("Characteristic#removeBatch", removeBatch),
    checkWillAffectSMG: wrapExpress("Characteristic#checkWillAffectSMG", checkWillAffectSMG)
};