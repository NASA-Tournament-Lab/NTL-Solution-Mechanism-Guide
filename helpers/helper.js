/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add populateHelpTopic, checkCanCreateHelpTopic, checkCanUpdateHelpTopic
 * 2. Remove validation of sort field in characteristics.
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var orm = require('orm');
var validate = require("./validator").validate;
var BadRequestError = require("../errors/BadRequestError");
var NotFoundError = require("../errors/NotFoundError");

//exported helper
var helper = {};

//underscore extensions
_.mixin({
    /**
     * Check if object is not null and undefined
     * @param {Object} obj the object to check
     * @returns {boolean} true if object is defined
     */
    isDefined: function (obj) {
        return !_.isNull(obj) && !_.isUndefined(obj);
    },
    /**
     * Set string value "null" to real null value
     * @param {Object} obj the containing object
     * @param {Array} params the array of names of properties to check "null" string value
     */
    setNullableStrings: function (obj, params) {
        var i;
        for (i = 0; i < params.length; i += 1) {
            if (obj[params[i]] === "null") {
                obj[params[i]] = null;
            }
        }
    },
    /**
     * Set string value "null" to real null value for all properties with "_id" suffix.
     * This is used for query string, because we every value in query string has string type.
     * @param {Object} obj the containing object
     */
    setNullableIds: function (obj) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (/_id$/.test(prop) && obj[prop] === "null") {
                    obj[prop] = null;
                }
            }
        }
    }
});

/**
 * Get single entity or return error if not found.
 * @param {String|Number} id the id of entity
 * @param {Object} model the orm2 model definition.
 * @param {Function<err, result>} callback the callback function
 */
helper.getSingle = function (id, model, callback) {
    model.one({id: id}, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (!result) {
            callback(new NotFoundError(model.collectionName + " not found with id=" + id));
        } else {
            callback(null, result);
        }
    });
};

/**
 * Check if given entity exists. If not then error is returned to the callback.
 * @param {String|Number} id the id of entity
 * @param {Object} model the orm2 model definition.
 * @param {Function<err>} callback the callback function
 */
helper.checkExists = function (id, model, callback) {
    helper.getSingle(id, model, function (err) {
        callback(err);
    });
};

/**
 * Check if exist any entity that match given criteria.
 * Error is return to callback if results are found.
 * @param {Object} criteria the search criteria
 * @param {Object} model the orm2 model definition.
 * @param {String} errorMessage the error message for error.
 * @param {Function<err>} callback the callback function
 */
helper.checkUnique = function (criteria, model, errorMessage, callback) {
    model.exists(criteria, function (err, exists) {
        if (err) {
            callback(err);
            return;
        }
        callback(exists ? new BadRequestError(errorMessage) : null);
    });
};

/**
 * Check if all elements of the array contain a unique value for the sort field.
 * @param {Array} input the array to check. If not an array then this method will return null.
 * @returns {Error} error if there are duplicated keys.
 */
helper.checkUniqueSort = function (input) {
    var values = _.pluck(input, 'sort'), map = {}, i, val;
    for (i = 0; i < values.length; i += 1) {
        val = values[i];
        //check only valid values
        //proper validation is in the other place
        if (!validate(val, "int+")) {
            if (map[val]) {
                return new BadRequestError("duplicated sort value: " + val);
            }
            map[val] = true;
        }
    }
    return null;
};


/**
 * Check if array contains duplicated ids.
 * This method should be used for batch operations like batchUpdate or batchDelete.
 * @param {Array<Number>} arr the array of object. Each object represents the id value.
 * @return {Error} error if some value has duplicated key
 */
helper.checkUniqueIds = function (arr) {
    var map = {}, i, id;
    for (i = 0; i < arr.length; i += 1) {
        id = arr[i];
        if (map[id]) {
            return new BadRequestError("Batch operation can contain only unique entities. Id = " + id +
                ' is defined more than once.');
        }
        map[id] = true;
    }
    return null;
};

/**
 * Get a function delegate that populate results and call original callback.
 * @param {Function} callback to wrap.
 * @param {Function<entity>} populateFn to populate function.
 * @returns {Function} the wrapped function
 */
helper.getPopulateDelegate = function (callback, populateFn) {
    return function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (_.isArray(result)) {
            async.map(result, function (smg, cb) {
                populateFn(smg, cb);
            }, callback);
        } else {
            populateFn(result, callback);
        }
    };
};

/**
 * Populate the SMG entity.
 * @param {Object} smg the smg to populate
 * @param {Function<err, smg>} callback the callback function
 */
helper.populateSMG = function (smg, callback) {
    async.parallel([
        function (cb) {
            smg.getExamples(cb);
        }, function (cb) {
            smg.getSmgCharacteristics(function (err) {
                if (err) {
                    cb(err);
                    return;
                }
                async.forEach(smg.smgCharacteristics, helper.populateSMGCharacteristic, cb);
            });
        }
    ], function (err) {
        callback(err, smg);
    });
};


/**
 * Populate the CharacteristicType entity.
 * @param {Object} ct the CharacteristicType entity to populate
 * @param {Function<err, smg>} callback the callback function
 */
helper.populateCT = function (ct, callback) {
    ct.getValues(function (err) {
        callback(err, ct);
    });
};

/**
 * Populate the Characteristic entity.
 * @param {Object} characteristic the Characteristic entity to populate
 * @param {Function<err, smg>} callback the callback function
 */
helper.populateCharacteristic = function (characteristic, callback) {
    async.series([
        function (cb) {
            characteristic.getType(cb);
        }, function (cb) {
            characteristic.getValues(cb);
        }
    ], function (err) {
        callback(err, characteristic);
    });
};

/**
 * Populate the SMGCharacteristic entity.
 * @param {Object} smgCharacteristic the SMGCharacteristic entity to populate
 * @param {Function<err, smgC>} callback the callback function
 */
helper.populateSMGCharacteristic = function (smgCharacteristic, callback) {
    async.series([
        function (cb) {
            smgCharacteristic.getCharacteristic(cb);
        }, function (cb) {
            helper.populateCharacteristic(smgCharacteristic.characteristic, cb);
        },
        function (cb) {
            smgCharacteristic.getValueType(cb);
        }
    ], function (err) {
        callback(err, smgCharacteristic);
    });
};

/**
 * Populate the SearchForm entity.
 * @param {Object} searchForm the SearchForm entity to populate
 * @param {Function<err, searchForm>} callback the callback function
 */
helper.populateSearchForm = function (searchForm, callback) {
    async.series([
        function (cb) {
            searchForm.getFields(cb);
        }, function (cb) {
            async.forEach(searchForm.fields, helper.populateSearchFormField, cb);
        }
    ], function (err) {
        callback(err, searchForm);
    });
};

/**
 * Populate the SearchFormField entity.
 * @param {Object} searchFormField the SearchFormField entity to populate
 * @param {Function<err, searchFormField>} callback the callback function
 */
helper.populateSearchFormField = function (searchFormField, callback) {
    async.series([
        function (cb) {
            searchFormField.getCharacteristic(cb);
        }, function (cb) {
            helper.populateCharacteristic(searchFormField.characteristic, cb);
        }, function (cb) {
            searchFormField.getValues(cb);
        }, function (cb) {
            async.forEach(searchFormField.values, helper.populateSearchFormFieldValue, cb);
        }
    ], function (err) {
        callback(err, searchFormField);
    });
};

/**
 * Populate the SearchFormFieldValue entity.
 * @param {Object} searchFormFieldValue the SearchFormFieldValue entity to populate
 * @param {Function<err, searchFormFieldValue>} callback the callback function
 */
helper.populateSearchFormFieldValue = function (searchFormFieldValue, callback) {
    searchFormFieldValue.getValueType(function (err) {
        callback(err, searchFormFieldValue);
    });
};

/**
 * Populate the HelpTopic entity.
 * @param {Object} helpTopic the HelpTopic entity to populate
 * @param {Function<err, searchFormFieldValue>} callback the callback function
 * @since 1.1
 */
helper.populateHelpTopic = function (helpTopic, callback) {
    helpTopic.getImage(function (err) {
        callback(err, helpTopic);
    });
};


/**
 * Check if Characteristic can be created. type_id FK must exists and sort must be unique.
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create the entity
 * @param {Function<err>} callback the callback function
 */
helper.checkCanCreateCharacteristic = function (db, values, callback) {
    helper.checkExists(values.type_id, db.models.characteristicType, callback);
};

/**
 * Check if Characteristic can be updated. type_id FK must exist and sort must be unique.
 * Updating type_id is not allowed if any SMGCharacteristic references to this entity.
 * @param {Object} db the orm2 database instance
 * @param {Number} id the id of the entity to be updated
 * @param {Object} values the values to create the entity
 * @param {Function<err>} callback the callback function
 */
helper.checkCanUpdateCharacteristic = function (db, id, values, callback) {
    var entity;
    async.waterfall([
        function (cb) {
            db.models.characteristic.get(id, cb);
        },
        function (result, cb) {
            entity = result;
            async.parallel({
                check: function (cbx) {
                    if (_.isDefined(values.type_id)) {
                        helper.checkExists(values.type_id, db.models.characteristicType, cbx);
                    } else {
                        cbx();
                    }
                },
                canUpdateCT: function (cbx) {
                    //disallow updating type_id if some SMGCharacteristic references to this
                    //characteristic
                    if (_.isDefined(values.type_id) && values.type_id !== entity.type_id) {
                        db.models.smgCharacteristic.exists({characteristic_id: entity.id }, function (err, exists) {
                            if (err) {
                                cbx(err);
                                return;
                            }
                            if (exists) {
                                cbx(new BadRequestError("Can't update type_id for Characteristic with id=" + id +
                                    ". Characteristic is already associated with SMGCharacteristic."));
                                return;
                            }
                            cbx();
                        });
                    } else {
                        cbx();
                    }
                }
            }, cb);
        }, function (result, cb) {
            cb();
        }
    ], callback);
};


/**
 * Check if Characteristic can be delete.
 * The SMGCharacteristic entity can't have a reference to this entity.
 * @param {Object} db the orm2 database instance
 * @param {Object} entity the entity to be deleted
 * @param {Function<err>} callback the callback function
 */
helper.checkCanDeleteCharacteristic = function (db, entity, callback) {
    if (entity.blockDelete) {
        callback(new BadRequestError("Characteristic with id=" + entity.id + " cannot be deleted."));
        return;
    }
    db.models.smgCharacteristic.exists({characteristic_id: entity.id }, function (err, exists) {
        if (err) {
            callback(err);
            return;
        }
        if (exists) {
            callback(new BadRequestError("Can't delete Characteristic with id=" + entity.id +
                ". Characteristic is already associated with SMGCharacteristic."));
        } else {
            callback();
        }
    });
};

/**
 * Check if CharacteristicType is references by other tables and return the error if can't be deleted.
 * Only CharacteristicTypeValues can be cascade deleted.
 * @param {Object} db the orm2 database instance
 * @param {Object} entity the CharacteristicType entity
 * @param {Function<err>} callback the callback function
 */
helper.checkCanDeleteCT = function (db, entity, callback) {
    async.waterfall([
        function (cb) {
            db.models.characteristic.one({type_id: entity.id}, cb);
        }, function (result, cb) {
            if (result) {
                cb(new BadRequestError("CharacteristicType with id=" + entity.id + " can't be deleted, " +
                    "because is referenced by Characteristic with id=" + result.id));
            } else {
                cb();
            }
        }
    ], callback);
};

/**
 * Check if HelpTopic can be created. image_id FK must exists.
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create the entity
 * @param {Function<err>} callback the callback function
 * @since 1.1
 */
helper.checkCanCreateHelpTopic = function (db, values, callback) {
    helper.checkExists(values.image_id, db.models.fileUpload, callback);
};

/**
 * Check if HelpTopic can be updated. image_id FK must exists.
 * @param {Object} db the orm2 database instance
 * @param {Object} values the values to create the entity
 * @param {Function<err>} callback the callback function
 * @since 1.1
 */
helper.checkCanUpdateHelpTopic = function (db, id, values, callback) {
    if (_.isDefined(values.image_id)) {
        helper.checkExists(values.image_id, db.models.fileUpload, callback);
    } else {
        callback();
    }
};

module.exports = helper;