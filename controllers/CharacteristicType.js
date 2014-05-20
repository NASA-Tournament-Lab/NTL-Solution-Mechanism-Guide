/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var crudHelper = require('../helpers/crudHelper');
var helper = require('../helpers/helper');
var wrapExpress = require("../helpers/logging").wrapExpress;
var validate = require("../helpers/validator").validate;

var Definition = {name: "string", description: "string"};
var Definition_updateSingle = {name: "string?", description: "string?"};
var Definition_updateBatch = [{id: "id", name: "string?", description: "string?"}];
var Definition_search = {name: "string?", description: "string?"};


/**
 * Retrieve the CharacteristicTypes. Search criteria is optional.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function index(req, db, callback) {
    crudHelper.filter(req.query, db.models.characteristicType, Definition_search, callback);
}

/**
 * Retrieve a single CharacteristicType.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function show(req, db, callback) {
    crudHelper.getSingle(req.params.id, db.models.characteristicType, callback);
}

/**
 * Create a CharacteristicType or batch of CharacteristicTypes.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createSingle(req, db, callback) {
    crudHelper.createSingleOrBatch(req.body, db.models.characteristicType, Definition, callback);
}


/**
 * Create batch of CharacteristicTypes.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function createBatch(req, db, callback) {
    crudHelper.createSingleOrBatch(req.body, db.models.characteristicType, Definition, callback);
}

/**
 * Update batch of CharacteristicTypes.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateBatch(req, db, callback) {
    crudHelper.updateBatch(req.body, db.models.characteristicType, Definition_updateBatch, callback);
}

/**
 * Update a CharacteristicType.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateSingle(req, db, callback) {
    crudHelper.updateSingle(req.params.id, req.body, db.models.characteristicType, Definition_updateSingle, callback);
}

/**
 * Remove batch of CharacteristicTypes.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeBatch(req, db, callback) {
    crudHelper.removeBatch(req.body, db.models.characteristicType, helper.checkCanDeleteCT.bind(null, db), callback);
}

/**
 * Remove a CharacteristicType.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeSingle(req, db, callback) {
    crudHelper.removeSingle(req.params.id, db.models.characteristicType, helper.checkCanDeleteCT.bind(null, db), callback);
}


module.exports = {
    index: wrapExpress("CharacteristicType#index", index),
    show: wrapExpress("CharacteristicType#show", show),
    createSingle: wrapExpress("CharacteristicType#createSingle", createSingle),
    createBatch: wrapExpress("CharacteristicType#createBatch", createBatch),
    updateSingle: wrapExpress("CharacteristicType#updateSingle", updateSingle),
    updateBatch: wrapExpress("CharacteristicType#updateBatch", updateBatch),
    removeSingle: wrapExpress("CharacteristicType#removeSingle", removeSingle),
    removeBatch: wrapExpress("CharacteristicType#removeBatch", removeBatch)
};