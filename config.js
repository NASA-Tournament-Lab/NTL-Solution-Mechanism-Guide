/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. set ejs view engine
 * 2. set static directory for css/js/images
 */
"use strict";

var express = require('express');
var path = require('path');
var handleError = require("./helpers/logging").handleError;
var NotFoundError = require("./errors/NotFoundError");

/**
 * Configure express app
 * @param {Object} app the express app to configure
 */
module.exports = function (app) {

    app.set('port', process.env.PORT || 3000);
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));
    // Handle unhandled errors.
    // The logging wrapper should handle all errors, but if request contains invalid json then
    // express framework is returning an error. This is the only error that should be caught here.
    app.use(function (err, req, res, next) {
        if (!err) {
            next();
            return;
        }
        err.isValidationError = true;
        handleError(err, res);
    });

    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(app.router);

    //return 404 error as json response
    app.use(function (req, res, next) {
        handleError(new NotFoundError("URI " + req.url + " does not exist."), res);
    });

};