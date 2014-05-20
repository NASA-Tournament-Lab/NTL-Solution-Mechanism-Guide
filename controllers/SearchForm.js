/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. In update operations 'fields' field is optional to update.
 * 2. Fix _checkActiveFlag validation. Some methods call it twice.
 * 3. Remove _checkActiveFlag call from createSingle/updateSingle (it is valid only for arrays).
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var orm = require('orm');
var crudHelper = require('../helpers/crudHelper');
var helper = require('../helpers/helper');
var wrapExpress = require("../helpers/logging").wrapExpress;
var validate = require("../helpers/validator").validate;
var BadRequestError = require("../errors/BadRequestError");

var FieldsDefinition = [{ characteristic: "id", value: "*", sort: "id" }];
var FieldsDefinitionOpt = {type: FieldsDefinition, required: false};
var Definition = { name: "string",  description: "string", active: "bool?", fields: FieldsDefinition };
var Definition_updateSingle = { name: "string?", description: "string?", active: "bool?", fields: FieldsDefinitionOpt };
var Definition_updateBatch = [{ id: "id", name: "string?", description: "string?",  active: "bool?", fields: FieldsDefinitionOpt }];
var Definition_search = {name: "string?", description: "string?", active: "bool?"};


/**
 * Create a SearchFormField and SearchFormFields for given searchForm.
 * @param {Object} db the orm2 database instance
 * @param {Number} formId the search form id
 * @param {Object} values the values to create
 * @param {Function<err>} callback the callback
 * @private
 */
function _createField(db, formId, values, callback) {
    var characteristic, formField;
    async.waterfall([
        function (cb) {
            helper.getSingle(values.characteristic, db.models.characteristic, cb);
        },
        function (result, cb) {
            characteristic = result;
            db.models.searchFormField.create({
                form_id: formId,
                characteristic_id: characteristic.id,
                sort: values.sort
            }, cb);
        }, function (result, cb) {
            formField = result;
            var error;
            if (_.isArray(values.value)) {
                error = validate(values.value, ["id"], "value");
                if (error) {
                    cb(error);
                    return;
                }
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
                        db.models.searchFormFieldValue.create({
                            field_id: formField.id,
                            valuetype_id: value
                        }, cbx);
                    });
                }, cb);
            } else {
                error = validate(values.value, "string", "value");
                if (error) {
                    cb(error);
                    return;
                }
                db.models.searchFormFieldValue.create({
                    field_id: formField.id,
                    value: values.value
                }, cb);
            }
        }
    ], function (err) {
        callback(err);
    });
}

/**
 * Create a SearchForm with given values
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
            db.models.searchForm.create({
                name: values.name,
                description: values.description,
                active: !!values.active
            }, cb);
        }, function (entity, cb) {
            result = entity;
            async.forEach(values.fields || [], _createField.bind(null, db, entity.id), cb);
        }, function (cb) {
            helper.populateSearchForm(result, cb);
        }
    ], function (err) {
        callback(err, result);
    });
}

/**
 * Update a SearchForm with given values. Previous values for SearchFromField are deleted.
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
            helper.getSingle(values.id, db.models.searchForm, cb);
        },
        function (entity, cb) {
            result = entity;
            var toUpdate = _.pick(values, "name", "description", "active");
            entity.save(toUpdate, cb);
        }, function (entity, cb) {
            result = entity;
            if (values.fields) {
                db.models.searchFormField.find({form_id: result.id}).remove(cb);
            } else {
                cb();
            }
        }, function () {
            var cb = arguments[arguments.length - 1];
            async.forEach(values.fields || [], _createField.bind(null, db, result.id), cb);
        }, function (cb) {
            helper.populateSearchForm(result, cb);
        }
    ], function (err) {
        callback(err, result);
    });
}

/**
 * Check if active flag is set only to single object.
 * @param {Array} input the array to check. If not an array then this method will return null.
 * @returns {Error} error if more than one object has flag set to true.
 * @private
 */
function _checkActiveFlag(input) {
    var values = _.pluck(input, 'active'), hasActive = false, i, val;
    for (i = 0; i < values.length; i += 1) {
        val = values[i];
        //check only valid values
        //proper validation is in the other place
        if (!validate(val, "bool") && val) {
            if (hasActive) {
                return new BadRequestError("Only one search form can set the active flag to true.");
            }
            hasActive = true;
        }
    }
    return null;
}

/**
 * Remove active flag from the current active SearchForm when we set this flag to the other SearchForm.
 * This method should be called after Create or Update operation.
 * @param {Object} db the orm2 database instance
 * @param {Array|Object} input the single SearchForm entity or array of SearchForm
 * @param {Function<err, input>} callback the callback function. The input param is passed to the callback.
 * @private
 */
function _fixActiveFlag(db, input, callback) {
    var entities = input, activeEntities, active;
    if (!_.isArray(input)) {
        entities = [entities];
    }
    activeEntities = _.where(entities, {active: true});
    if (activeEntities.length === 0) {
        callback(null, input);
        return;
    }
    active = activeEntities[0];
    async.waterfall([
        function (cb) {
            db.models.searchForm.find({active: true, id: orm.ne(active.id)}, cb);
        }, function (results, cb) {
            //results.length should be 0 or 1
            //better fix them all
            async.forEach(results, function (sf, cbx) {
                sf.active = false;
                sf.save(cbx);
            }, cb);
        }
    ], function (err) {
        callback(err, input);
    });
}

/**
 * Get a function delegate that populate results and call original callback.
 * @param {Function} callback to wrap.
 * @returns {Function} the wrapped function
 * @private
 */
function _getPopulateDelegate(callback) {
    return helper.getPopulateDelegate(callback, helper.populateSearchForm);
}

/**
 * Retrieve the SearchForms. Search criteria is optional.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function index(req, db, callback) {
    if (req.query.active === 'true') {
        req.query.active = true;
    }
    if (req.query.active === 'false') {
        req.query.active = false;
    }
    crudHelper.filter(req.query, db.models.searchForm, Definition_search, _getPopulateDelegate(callback));
}

/**
 * Retrieve a single SearchForm.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function show(req, db, callback) {
    crudHelper.getSingle(req.params.id, db.models.searchForm, _getPopulateDelegate(callback));
}

/**
 * Create a SearchForm or batch of SearchForms.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createSingle(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.body, Definition);
            cb(error);
        }, function (cb) {
            _create(db, req.body, cb);
        }, function (result, cb) {
            _fixActiveFlag(db, result, cb);
        }
    ], callback);
}

/**
 * Create a SearchForm or batch of SearchForms.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createBatch(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = _checkActiveFlag(req.body) || validate(req.body, [Definition]);
            cb(error);
        }, function (cb) {
            async.map(req.body, _create.bind(null, db), cb);
        }, function (result, cb) {
            _fixActiveFlag(db, result, cb);
        }
    ], callback);
}


/**
 * Update batch of SearchForms.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateBatch(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = _checkActiveFlag(req.body) || validate(req.body, Definition_updateBatch);
            cb(error);
        }, function (cb) {
            async.map(req.body, _update.bind(null, db), cb);
        }, function (result, cb) {
            _fixActiveFlag(db, result, cb);
        }
    ], callback);
}

/**
 * Update a SearchForm.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateSingle(req, db, callback) {
    async.waterfall([
        function (cb) {
            var error = validate(req.params.id, "stringId", "id") ||
                validate(req.body, Definition_updateSingle);
            cb(error);
        }, function (cb) {
            req.body.id = Number(req.params.id);
            _update(db, req.body, cb);
        }, function (result, cb) {
            _fixActiveFlag(db, result, cb);
        }
    ], callback);
}


/**
 * Remove batch of SearchForms.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeBatch(req, db, callback) {
    crudHelper.removeBatch(req.body, db.models.searchForm, callback);
}

/**
 * Remove a SearchForm.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeSingle(req, db, callback) {
    crudHelper.removeSingle(req.params.id, db.models.searchForm, callback);
}


module.exports = {
    index: wrapExpress("SearchForm#index", index),
    show: wrapExpress("SearchForm#show", show),
    createSingle: wrapExpress("SearchForm#createSingle", createSingle),
    createBatch: wrapExpress("SearchForm#createBatch", createBatch),
    updateSingle: wrapExpress("SearchForm#updateSingle", updateSingle),
    updateBatch: wrapExpress("SearchForm#updateBatch", updateBatch),
    removeSingle: wrapExpress("SearchForm#removeSingle", removeSingle),
    removeBatch: wrapExpress("SearchForm#removeBatch", removeBatch)
};