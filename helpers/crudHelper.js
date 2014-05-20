/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. Delete property _t in filter. This is used to prevent caching by browser
 */
"use strict";


var async = require('async');
var _ = require('underscore');
var validate = require("./validator").validate;
var NotFoundError = require("../errors/NotFoundError");
var helper = require("./helper");


/**
 * Search for entities. It also performs the validation.
 * @param {Object} [criteria] the search criteria. It should have same properties as the model.
 * @param {Object} model the orm2 model definition.
 * @param {Object} definition the rox definition schema used for validation.
 * @param {Function<err, result>} callback the callback function. Result is array of entities.
 */
function filter(criteria, model, definition, callback) {
    delete criteria._t;
    criteria = criteria || {};
    var error = validate(criteria, definition);
    if (error) {
        callback(error);
        return;
    }
    model.find(criteria, callback);
}

/**
 * Get a single entity. It also performs the validation. If not found, error is returned.
 * @param {String|Number} id the id of entity to get.
 * @param {Object} model the orm2 model definition.
 * @param {Function<err, result>} callback the callback function. Result is array of entities.
 */
function getSingle(id, model, callback) {
    var error = validate(id, "stringId", "id");
    if (error) {
        callback(error);
        return;
    }
    helper.getSingle(id, model, callback);
}

/**
 * Create a single entity or batch of entities. It also performs the validation.
 * @param {Object|Array} input the values to create the entity. It's a single object or an array.
 * @param {Object} model the orm2 model definition.
 * @param {Object} definition the rox definition schema used for validation.
 * @param {Function<input, callback>} [validateInputFun] the optional function for input validation. The first parameter
 * is a single input value, callback should return only error if validation failed. This method can be used for checking
 * foreign key constrains or some custom validation.
 * @param {Function<err, result>} callback the callback function. Result is a created entity or array of entities if
 * input is batch.
 */
function createSingleOrBatch(input, model, definition, validateInputFun, callback) {
    var error, batch = true;
    if (!callback) {
        callback = validateInputFun;
        validateInputFun = null;
    }
    async.waterfall([
        function (cb) {
            if (!_.isArray(input)) {
                error = validate(input, definition);
                batch = false;
                input = [input];
            } else {
                error = validate(input, [definition]);
            }
            cb(error);
        }, function (cb) {
            async.forEach(input, function (obj, cbx) {
                if (validateInputFun) {
                    validateInputFun(obj, cbx);
                } else {
                    cbx();
                }
            }, cb);
        }, function (cb) {
            async.map(input, model.create, cb);
        }, function (results, cb) {
            cb(null, batch ? results : results[0]);
        }
    ], callback);
}

/**
 * Update a batch of entities. It also performs the validation.
 * @param {Array} input the values to update the entity. Each element must have defined `id` property.
 * @param {Object} model the orm2 model definition.
 * @param {Object} definition the rox definition schema used for validation.
 * @param {Function<id, input, callback>} [validateInputFun] the optional function for input validation.
 * The first parameter is id of the updated entity. The second parameter represents values to update,
 * callback should return only error if validation failed. This method can be used for checking
 * foreign key constrains or some custom validation.
 * @param {Function<err, result>} callback the callback function. Result is the array of updated entities.
 */
function updateBatch(input, model, definition, validateInputFun, callback) {
    var error;
    if (!callback) {
        callback = validateInputFun;
        validateInputFun = null;
    }
    async.waterfall([
        function (cb) {
            error = validate(input, definition) || helper.checkUniqueIds(_.pluck(input, 'id'));
            cb(error);
        }, function (cb) {
            //first we check if all object exists
            async.map(input, function (obj, cbx) {
                var entity;
                async.waterfall([
                    function (cbk) {
                        model.one({id: obj.id}, cbk);
                    }, function (result, cbk) {
                        entity = result;
                        if (!entity) {
                            cbx(new NotFoundError(model.collectionName + " not found with id=" + obj.id));
                            return;
                        }
                        if (validateInputFun) {
                            validateInputFun(obj.id, obj, cbk);
                        } else {
                            cbk();
                        }
                    }, function (cbk) {
                        cbk(null, {entity: entity, obj: obj});
                    }
                ], cbx);
            }, cb);
        }, function (results, cb) {
            //now we update all
            async.map(results, function (ele, cbx) {
                ele.entity.save(ele.obj, cbx);
            }, cb);
        }
    ], callback);
}

/**
 * Update a single entity. It also performs the validation.
 * @param {String|Number} id the id of entity to update.
 * @param {Object} input the values to update the entity.
 * @param {Object} model the orm2 model definition.
 * @param {Object} definition the rox definition schema used for validation.
 * @param {Function<id, input, callback>} [validateInputFun] the optional function for input validation.
 * The first parameter is id of the updated entity. The second parameter represents values to update,
 * callback should return only error if validation failed. This method can be used for checking
 * foreign key constrains or some custom validation.
 * @param {Function<err, result>} callback the callback function. Result is a updated entity.
 */
function updateSingle(id, input, model, definition, validateInputFun, callback) {
    if (!callback) {
        callback = validateInputFun;
        validateInputFun = null;
    }
    var entity;
    async.waterfall([
        function (cb) {
            var error = validate(id, "stringId", "id") || validate(input, definition);
            cb(error);
        }, function (cb) {
            model.one({id: id}, cb);
        }, function (result, cb) {
            entity = result;
            if (!result) {
                cb(new NotFoundError(model.collectionName + " not found with id=" + id));
                return;
            }
            if (validateInputFun) {
                validateInputFun(id, input, cb);
            } else {
                cb();
            }
        }, function (cb) {
            entity.save(input, cb);
        }
    ], callback);
}

/**
 * Remove a single entity.
 * @param {String|Number} id the id of entity to remove.
 * @param {Object} model the orm2 model definition.
 * @param {Function<result, callback>} [validateInputFun] the optional function for input validation.
 * The first parameter is the entity to be deleted. This method can be used for checking
 * foreign key constrains or some custom validation.
 * @param {Function<err>} callback the callback function.
 */
function removeSingle(id, model, validateInputFun, callback) {
    if (!callback) {
        callback = validateInputFun;
        validateInputFun = null;
    }
    var error, entity;
    async.waterfall([
        function (cb) {
            error = validate(id, "stringId", "id");
            cb(error);
        }, function (cb) {
            model.one({id: id}, cb);
        }, function (result, cb) {
            entity = result;
            if (!result) {
                cb(new NotFoundError(model.collectionName + " not found with id=" + id));
                return;
            }
            if (validateInputFun) {
                validateInputFun(result, cb);
            } else {
                cb();
            }
        }, function (cb) {
            entity.remove(cb);
        }
    ], callback);
}

/**
 * Remove a batch of entities. It also performs the validation.
 * @param {Array} input the array of ids to remove the entities.
 * @param {Object} model the orm2 model definition.
 * @param {Function<entity, callback>} [validateInputFun] the optional function for input validation.
 * The first parameter is the entity to be deleted. This method can be used for checking
 * foreign key constrains or some custom validation.
 * @param {Function<err, result>} callback the callback function. Result is the array of removed entities.
 */
function removeBatch(input, model, validateInputFun, callback) {
    if (!callback) {
        callback = validateInputFun;
        validateInputFun = null;
    }
    var error;
    async.waterfall([
        function (cb) {
            error = validate(input, ["id"]) || helper.checkUniqueIds(input);
            cb(error);
        }, function (cb) {
            //first we check if all object exists
            async.map(input, function (id, cbx) {
                async.waterfall([
                    function (cbx) {
                        model.one({id: id}, cbx);
                    }, function (result, cbx) {
                        if (!result) {
                            cbx(new NotFoundError(model.collectionName + " not found with id=" + id));
                            return;
                        }
                        if (validateInputFun) {
                            validateInputFun(result, function (err) {
                                cbx(err, result);
                            });
                        } else {
                            cbx(null, result);
                        }
                    }
                ], cbx);
            }, cb);
        }, function (results, cb) {
            //now we remove all
            async.map(results, function (ele, cbx) {
                ele.remove(cbx);
            }, cb);
        }
    ], callback);
}

module.exports = {
    createSingleOrBatch: createSingleOrBatch,
    updateBatch: updateBatch,
    removeBatch: removeBatch,
    updateSingle: updateSingle,
    filter: filter,
    getSingle: getSingle,
    removeSingle: removeSingle
};
