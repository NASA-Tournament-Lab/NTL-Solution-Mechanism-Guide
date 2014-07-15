/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add models FileUpload, Dashboard
 */
"use strict";

var winston = require('winston');
var _ = require('underscore');
var async = require('async');
var config = require('./config/configuration');
var orm = require('orm');
var transaction = require("orm-transaction");
var modelNames = ["Dashboard", "SMG", "Example", "FileUpload", "HelpTopic", "CharacteristicType", "Characteristic", "CharacteristicTypeValue",
    "SMGCharacteristic", "SearchForm", "SearchFormField", "SearchFormFieldValue", "ExampleType"];
var models;
var db;
var fs = require('fs');
orm.settings.set('instance.cache', false);

/**
 * Setup database. Returns database instance in callback parameter.
 * @param {Function<db>} callback the callback function
 * @param {Boolean} [recreate] flag if drop and create all tables
 */
module.exports = function (callback, recreate) {
    db = orm.connect(config.database);
    async.series([
        function (cb) {
            db.on('connect', cb);
        },
        function (cb) {
            db.use(transaction);
            models = _.map(modelNames, function (name) {
                var model = require('./models/' + name);
                model._name =  name;
                return model;
            });
            //load the schema models
            async.forEachSeries(models, function (modelFun, cbx) {
                modelFun.init(db, function (err, model) {
                    modelFun.model = model;
                    cbx(err);
                });
            }, cb);
        },
        function (cb) {
            if (!recreate) {
                callback(null, db);
                return;
            }
            //drop this FK manually because there is a circular reference between SMG and Example table
            var sql = fs.readFileSync(__dirname + "/sql/drop_FK_example_smg.sql", 'utf8');
            db.driver.execQuery(sql, function () {
                //ignore error
                cb();
            });
        }, function (cb) {
            //drop all tables in reverse order
            models.reverse();
            async.forEachSeries(models, function (modelFun, cbx) {
                winston.info("drop model " + modelFun._name);
                modelFun.model.drop(cbx);
            }, cb);
        }, function (cb) {
            models.reverse();//revert reverse
            //sync all tables
            async.forEachSeries(models, function (modelFun, cbx) {
                winston.info("sync model " + modelFun._name);
                modelFun.model.sync(function (err) {
                    if (err) {
                        cbx(err);
                        return;
                    }
                    if (modelFun.syncSql) {
                        var sqls = modelFun.syncSql;
                        if (!_.isArray(sqls)) {
                            sqls = [sqls];
                        }
                        async.forEachSeries(sqls, function (sqlFilename, cbk) {
                            var sql = fs.readFileSync(__dirname + "/sql/" + sqlFilename, 'utf8');
                            db.driver.execQuery(sql, cbk);
                        }, cbx);
                    } else {
                        cbx();
                    }
                });
            }, cb);
        }
    ], function (err) {
        callback(err, db);
    });
};