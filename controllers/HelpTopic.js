/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add action uploadFile for uploading files
 * 2. HelpTopic is referencing uploadFile#id as image_id (create/update/get methods are revamped)
 */
"use strict";

var config = require('../config/configuration');
var Path = require('path');
var async = require('async');
var _ = require('underscore');
var crudHelper = require('../helpers/crudHelper');
var helper = require('../helpers/helper');
var NotFoundError = require('../errors/NotFoundError');
var wrapExpress = require("../helpers/logging").wrapExpress;
var validate = require("../helpers/validator").validate;
var IllegalArgumentError = require("../errors/IllegalArgumentError");
var fs = require('fs');

var HelperTopicDefinition_search = {id: "id?", name: "string?", description: "string?"};
var HelperTopicDefinition_create = {name: "string", description: "string", image_id: "id"};
var HelperTopicDefinition_update = {name: "string?", description: "string?", image_id: "id?"};

/**
 * Copy file from one place to other. This used to save the uploaded files.
 * @param {String} source the source path
 * @param {String} target the target path
 * @param {Function<err>} callback the callback function
 */
function copyFile(source, target, callback) {
    var cbCalled = false,
        rd = fs.createReadStream(source),
        wr = fs.createWriteStream(target);
    function done(err) {
        if (!cbCalled) {
            callback(err);
            cbCalled = true;
        }
    }
    rd.on("error", done);
    wr.on("error", done);
    wr.on("close", done);
    rd.pipe(wr);
}


/**
 * Get a function delegate that populate results and call original callback.
 * @param {Function} callback to wrap.
 * @returns {Function} the wrapped function
 * @private
 */
function _getPopulateDelegate(callback) {
    return function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (_.isArray(result)) {
            async.map(result, helper.populateHelpTopic, callback);
        } else {
            helper.populateHelpTopic(result, callback);
        }
    };
}


/**
 * Get File and resize it
 * @param {String} filePath the file path
 * @param {String} width the width
 * @param {String} height the height
 * @param callback{Function<err, stream>} the callback function
 */
function _resizeFile(filePath, width, height, callback) {
    var fs = require('fs'), gm = require('gm');
    async.waterfall([
        function (cb) {
            fs.readFile(filePath, cb);
        }, function (data, cb) {
            var gmImg = gm(data);
            width = Number(width);
            height = Number(height);
            gmImg.size(function (err, value) {
                if (err) {
                    cb(err);
                    return;
                }
                var sourceWidth = value.width,
                    sourceHeight = value.height,
                    p = Math.min(sourceWidth / width, sourceHeight / height),
                    destWidth = Math.round(width * p),
                    destHeight = Math.round(height * p),
                    centerX = Math.round((sourceWidth - destWidth) / 2),
                    centerY = Math.round((sourceHeight - destHeight) / 2);

                gmImg.crop(destWidth, destHeight, centerX, centerY)
                    .resize(width, height)
                    .stream(cb);
            });
        }
    ], function (err, stream) {
        callback(err, stream);
    });
}


/**
 * Retrieve the HelperTopics. Search criteria is optional.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function index(req, db, callback) {
    crudHelper.filter(req.query, db.models.helpTopic, HelperTopicDefinition_search, _getPopulateDelegate(callback));
}

/**
 * Retrieve a single HelpTopic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function show(req, db, callback) {
    crudHelper.getSingle(req.params.id, db.models.helpTopic, _getPopulateDelegate(callback));
}

/**
 * Create a HelpTopic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function create(req, db, callback) {
    crudHelper.createSingleOrBatch(req.body,
        db.models.helpTopic,
        HelperTopicDefinition_create,
        helper.checkCanCreateHelpTopic.bind(helper, db),
        callback);
}


/**
 * Update a HelpTopic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function updateSingle(req, db, callback) {
    crudHelper.updateSingle(req.params.id,
        req.body,
        db.models.helpTopic,
        HelperTopicDefinition_update,
        helper.checkCanUpdateHelpTopic.bind(helper, db),
        callback);
}

/**
 * Create a HelpTopic.
 * @param {Object} req the express request
 * @param {Object} res the express response
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function download(req, res, db, callback) {
    var topic;
    async.waterfall([
        function (cb) {
            var error = validate(req.params.id, "stringId", "id");
            cb(error);
        }, function (cb) {
            db.models.fileUpload.one({id: req.params.id}, cb);
        }, function (result, cb) {
            topic = result;
            if (!topic) {
                cb(new NotFoundError("FileUpload is not found with id=" + req.params.id));
                return;
            }
            fs.exists(topic.path, function (exists) {
                cb(null, exists);
            });
        }, function (exists, cb) {
            if (!exists) {
                //return as internal server error
                cb(new Error("File not found on disk!"));
                return;
            }
            res.type(topic.mime);
            if (req.query.width && req.query.height) {
                res.setHeader('Cache-Control', 'public, max-age=' + 31557600000);
                _resizeFile(topic.path, req.query.width, req.query.height, function (err, stream) {
                    if (err) {
                        return cb(err);
                    }
                    stream.pipe(res);
                });
            } else {
                res.download(topic.path, topic.filename, cb);
            }
        }
    ], function (err) {
        callback(err, null);
    });
}


/**
 * Remove batch of HelpTopic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeBatch(req, db, callback) {
    crudHelper.removeBatch(req.body, db.models.helpTopic, _getPopulateDelegate(callback));
}

/**
 * Remove a HelpTopic.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 */
function removeSingle(req, db, callback) {
    crudHelper.removeSingle(req.params.id, db.models.helpTopic, _getPopulateDelegate(callback));
}

/**
 * Upload a file.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err, result>} callback the callback function
 * @since 1.1
 */
function uploadFile(req, db, callback) {
    var file, path;
    if (!req.files || !req.files.file) {
        callback(new IllegalArgumentError("file must be provided"));
        return;
    }

    file = req.files.file;
    path = Path.join(config.downloadsDir, file.name + "-" + (new Date().getTime()));
    async.waterfall([
        function (cb) {
            copyFile(file.path, path, cb);
        }, function (cb) {
            db.models.fileUpload.create({
                path: path,
                mime: file.type,
                filename: file.name
            }, cb);
        }
    ], callback);
}


module.exports = {
    create: wrapExpress("HelpTopic#create", create),
    index: wrapExpress("HelpTopic#index", index),
    show: wrapExpress("HelpTopic#show", show),
    removeBatch: wrapExpress("HelpTopic#removeBatch", removeBatch),
    removeSingle: wrapExpress("HelpTopic#removeSingle", removeSingle),
    updateSingle: wrapExpress("HelpTopic#updateSingle", updateSingle),
    download: wrapExpress("HelpTopic#download", download, true),
    uploadFile: wrapExpress("HelpTopic#uploadFile", uploadFile)
};