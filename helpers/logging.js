/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. change handleError. Return sql error with unique constrains as Bad Request.
 * 2. close db when request ends.
 * 3. don't create transactions for GET requests
 */
"use strict";

var _ = require('underscore');
var async = require('async');
var winston = require('winston');
var BadRequestError = require("../errors/BadRequestError");
var IllegalArgumentError = require("../errors/IllegalArgumentError");
var NotFoundError = require("../errors/NotFoundError");
var initDb = require("../db");


/**
 * Api codes
 */
var apiCodes = {
    OK: { name: 'OK', value: 200, description: 'Success' },
    notModified: { name: 'Not Modified', value: 304, description: 'There was no new data to return.' },
    badRequest: { name: 'Bad Request', value: 400, description: 'The request was invalid. An accompanying message will explain why.' },
    unauthorized: { name: 'Unauthorized', value: 401, description: 'Authentication credentials were missing or incorrect.' },
    forbidden: { name: 'Forbidden', value: 403, description: 'The request is understood, but it has been refused or access is not allowed.' },
    notFound: { name: 'Not Found', value: 404, description: 'The URI requested is invalid or the requested resource does not exist.'  },
    serverError: {  name: 'Internal Server Error', value: 500, description: 'Something is broken. Please contact support.' }
};

/**
 * Handle error and return as JSON to the response.
 * @param {Error} error the error to handle
 * @param {Object} res the express response object
 */
function handleError(error, res) {
    var errdetail, baseError = apiCodes.serverError;
    if (error.isValidationError ||
            error instanceof IllegalArgumentError ||
            error instanceof BadRequestError) {
        baseError = apiCodes.badRequest;
    } else if (error instanceof NotFoundError) {
        baseError = apiCodes.notFound;
    } else if (error.code === 'ER_DUP_ENTRY') {
        baseError = apiCodes.badRequest;
        if (error.message.indexOf("UC_c_sort") !== -1) {
            error.message += ". Pair of the columns 'sort' and 'tab' must be unique.";
        }
    }
    errdetail = _.clone(baseError);
    errdetail.details = error.message;
    res.statusCode = baseError.value;
    res.json(errdetail);
}


/**
 * This function create a delegate for the express action.
 * Input and output logging is performed.
 * Errors are handled also and proper http status code is set.
 * Wrapped method must always call the callback function, first param is error, second param is object to return.
 * @param {String} signature the signature of the method caller
 * @param {Function} fn the express method to call. It must have signature (req, res, callback) or (req, callback). Res
 * parameter is optional, because he is usually not used.
 * @param {Boolean} customHandled true if the express action is handling the response.
 * This is useful for downloading files. Wrapper will render only the error response.
 * @returns {Function} the wrapped function
 */
function wrapExpress(signature, fn, customHandled) {
    if (!_.isString(signature)) {
        throw new Error("signature should be a string");
    }
    if (!_.isFunction(fn)) {
        throw new Error("fn should be a function");
    }
    return function (req, res, next) {
        var paramsToLog, db, transaction, apiResult, canRollback = false, useGlobalDB = req.method === 'GET';

        paramsToLog =  {
            body: req.body,
            params: req.params,
            query : req.query,
            url: req.url
        };
        winston.info("ENTER %s %j", signature, paramsToLog, {});
        var disposeDB = function () {
            if (useGlobalDB) {
                return;
            }
            //close db connection
            //we need this timeout because there is a bug for parallel requests
            setTimeout(function () {
                db.driver.close();
            }, 1000);
        };
        async.waterfall([
            function (cb) {
                if (useGlobalDB) {
                    db = global.db;
                    cb();
                } else {
                    async.waterfall([
                        function (cb) {
                            initDb(cb, false);
                        }, function (result, cb) {
                            db = result;
                            db.transaction(cb);
                        }, function (t, cb) {
                            transaction = t;
                            canRollback = true;
                            cb();
                        }
                    ], cb);
                }
            }, function (cb) {
                if (fn.length === 3) {
                    fn(req, db, cb);
                } else {
                    fn(req, res, db, cb);
                }
            }, function (result, cb) {
                apiResult = result;
                if (useGlobalDB) {
                    cb();
                } else {
                    transaction.commit(cb);
                }
            }, function (cb) {
                if (process.env.NO_LOG_RESPONSE) {
                    paramsToLog.response = "<disabled>";
                } else {
                    paramsToLog.response = apiResult;
                }
                winston.info("EXIT %s %j", signature, paramsToLog, {});
                if (!customHandled) {
                    res.json(apiResult);
                }
                disposeDB();
            }
        ], function (error) {
            if (canRollback && transaction) {
                transaction.rollback(function () {
                });
            }
            disposeDB();
            winston.error("EXIT %s %j\n", signature, paramsToLog, error.stack);
            handleError(error, res);
        });
    };
}


module.exports = {
    wrapExpress: wrapExpress,
    apiCodes: apiCodes,
    handleError: handleError
};