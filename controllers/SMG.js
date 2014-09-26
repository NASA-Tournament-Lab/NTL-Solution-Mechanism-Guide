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
var archiver = require('archiver');
var csv = require('csv');
var fs = require('fs');
//value for not exist Characteristics for SMG
var nullCharacteristicsValue="[NULL]";
var SMGDefinition_create = {
    name: "string?",
    description: "string?",
    characteristics: [ {characteristic: "id", value: "value"}],
    examples: [{name: "string", description: "string", type: "string", imageId: "id",  __obj: true}]
};
var SMGDefinition_updateSingle = {
    name: "string?",
    description: "string?",
    characteristics: [ {characteristic: "id", value: "value"}],
    examples: [{name: "string", description: "string", type: "string", imageId: "id", __obj: true}]
};
var SMGDefinition_updateBatch = [{
    id: "id",
    name: "string?",
    description: "string?",
    characteristics: [ {characteristic: "id", value: "value"}],
    examples: [{name: "string", description: "string", type: "string", imageId: "id", __obj: true}]
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
    var conditionCount, groups;
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
            conditionCount = conditions.length;
            //we must exec query: conditions[0] AND conditions[1] AND ...
            //we exec for each item SMGCharacteristic.find(conditions[i]) and find intersection
            async.map(conditions, function (condition, cbx) {
                db.models.smgCharacteristic.find(condition).only('smg_id').run(cbx);
            }, cb);
        }, function (results, cb) {
            //results is something like [[{smg_id:1}, {smg_id:2}], [{smg_id:3}, {smg_id:3}, {smg_id:1}]]
            var ids = _.chain(results).flatten().pluck("smg_id").value();
            //ids is [ 1, 2, 3, 1 ]
            groups = _.countBy(ids, function (ele) {
                return ele;
            });

            db.models.smg.find({id: _.unique(ids)}, cb);
        }, function (smgs, cb) {
            async.map(smgs, helper.populateSMG, cb);
        }, function (smgs, cb) {
            _.each(smgs, function (smg) {
                smg.accuracy = groups[smg.id] / conditionCount;
            });
            cb(null, smgs);
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

/**
 * Retrieve the Characteristics by giving ids.
 * @param {Array} ids the ids
 * @param {Function<err, result>} callback the callback function
 */
function getCharacteristic(ids,callback){
    async.waterfall([
        function (cb) {
            cb(validate(ids, ["id"]) || helper.checkUniqueIds(ids));
        }, function (cb) {
            crudHelper.filter({id:ids}, db.models.characteristic, {id:["id"]}, helper.getPopulateDelegate(function(err,result) {
                cb(err,result)
            }, helper.populateCharacteristic));
        }], function (err,result) {
            callback(err,result);
        });
}

/**
 * Get ordered Characteristics
 * @param input the input characteristics
 * @param ids the order ids
 * @returns {Array} the ordered characteristics
 */
function getOrderedCharacteristics(input,ids){
    var data = _.indexBy(input,"id");
    var result =[];
    for(var i=0;i<ids.length;i++){
        result.push(data[ids[i]]);
    }
    return result;
}

/**
 * Export SMG entities.
 * @param {Object} req the express request
 * @param {Object} res the express response
 * @param {Object} db the orm2 database instance
 * @param {Function<err,result>} callback the callback function
 */
function exportSMG(req, res,db, callback) {
    var ids = req.body.ids || [];
    ids =  _.map(ids, function(str){ return Number(str); });
    var characteristics;
    async.waterfall([
        function (cb) {
            getCharacteristic(ids,cb);
        },function (result,cb) {
            characteristics =getOrderedCharacteristics(result,ids);
            crudHelper.filter(req.query, db.models.smg, SMGDefinition_search, _getPopulateDelegate(cb));
        }],function(err,result){
            if(err){
                callback(err);
                return;
            }
            var zipArchiver = archiver('zip');
            zipArchiver.on('close', function() {
                callback(null);
            });
            zipArchiver.on('error', function(err) {
                callback(err);
            });
            res.setHeader('Content-disposition', 'attachment; filename="smgs.zip"');
            res.setHeader('Content-type', 'application/x-zip-compressed');
            zipArchiver.pipe(res);
            //export field-mapping.csv
            var fieldNames =["Name","Description","Tab","Type"];
            var mappings =[];
            mappings.push(fieldNames);
           for(var i=0;i<characteristics.length;i++){
               var values =[];
               var item = characteristics[i];
               values.push(item.name);
               values.push(item.description);
               values.push(item.tab);
               values.push(item.type.name);
               mappings.push(values);
           }
            csv.stringify(mappings, function(err, data){
                    if(err){
                        callback(err);
                        return;
                    }
                    zipArchiver
                        .append(data, { name: 'field-mapping.csv' });
                    //export SMG entities
                    async.map(result, function(smg,cb){
                        var smgCharacteristics=[];
                        var values={};
                        for(var j=0;j<smg.smgCharacteristics.length;j++){
                            var smgCharacteristic = smg.smgCharacteristics[j];
                            if(ids.indexOf(smgCharacteristic.characteristic_id)!=-1){
                                if(smgCharacteristic.value){
                                    values[smgCharacteristic.characteristic_id]=smgCharacteristic.value;
                                }else{
                                    //use valueType.name not valuetype_id
                                    if(values[smgCharacteristic.characteristic_id]){
                                        values[smgCharacteristic.characteristic_id].push(smgCharacteristic.valueType.name);
                                    }else{
                                        values[smgCharacteristic.characteristic_id]= [smgCharacteristic.valueType.name];
                                    }
                                }
                            }
                        }
                        //use order of input ids
                        for(var i=0;i<ids.length;i++){
                            var id = ids[i];
                            if(values[id]){
                                if(_.isArray(values[id])){
                                    smgCharacteristics.push([values[id].join(",")]);
                                }else{
                                    smgCharacteristics.push([values[id]]);
                                }
                            }else{
                                //empty when not exist
                                smgCharacteristics.push([nullCharacteristicsValue]);
                            }
                        }
                        csv.stringify(smgCharacteristics, function(err, data){
                            if(err){
                                cb(err);
                                return;
                            }
                            zipArchiver
                                .append(data, { name: smg.id+'.csv' });
                            cb();
                        });
                    }, function(err){
                        if(err){
                            callback(err);
                            return;
                        }
                        zipArchiver.finalize();
                    });
                });
        });
}

/**
 * Import SMG entities.
 * @param {Object} req the express request
 * @param {Object} db the orm2 database instance
 * @param {Function<err,result>} callback the callback function
 */
function importSMG(req,db, callback) {
    var smgs=[];
    var fileNameExpression= /(.+).csv/i;
    var multiValueTypes=["checkbox","picklist","radio"];
    var ids = req.body.ids || [];
    ids =  _.map(ids, function(str){ return Number(str); });
    var characteristics;
    async.waterfall([
        function (cbk) {
            var error = null;
            if(!req.files.smg){
                error =new BadRequestError("should exist files when importing smg entities");
            }
            cbk(error);
        },
        function (cbk) {
            getCharacteristic(ids,cbk);
        },function (result,cbk) {
            characteristics = getOrderedCharacteristics(result,ids);
            var files = req.files.smg;
            if(!_.isArray(files)){
                files = [files];
            }
            async.mapSeries(files, function(file,cb){
                var originalFilename =file.originalFilename;
                var nameResult= fileNameExpression.exec(originalFilename);
                if(!nameResult){
                    cb(new BadRequestError("File '"+file.originalFilename+"' contains invalid csv file name"));
                    return;
                }
                fs.readFile(file.path,function(err,input){
                    if(err){
                        cb(err);
                        return;
                    }
                    csv.parse(input.toString(), function(err, data){
                        if(!err && data && data.length>0){
                            if(data.length!=ids.length){
                                err = new BadRequestError("File '"+file.originalFilename+"' contains invalid numbers of lines(valid lines number is "+ids.length+")");
                            }else{
                                var rowValues=[];
                                for(var i=0;i<data.length;i++){
                                    if(data[i].length != 1){
                                        err = new BadRequestError("File '"+file.originalFilename+"' Line "+(i+1)+" contains invalid numbers of rows(1 row is valid)");
                                        break;
                                    }
                                    rowValues.push({line:(i+1),row:data[i]});
                                }
                                smgs.push({
                                    data:rowValues,
                                    originalFilename:originalFilename
                                });
                            }
                        }
                        cb(err);
                    });
                });
            },function(err){
                cbk(err);
            });
        },function(cbk){
            async.map(smgs, function(item,cb){
                async.map(item.data, function (rowValue, cbp) {
                    var lineNumber = Number(rowValue.line);
                    var matchCharacteristics = characteristics[lineNumber - 1];
                    var valueType = matchCharacteristics.type.name;
                    var characteristicValue = rowValue.row[0];
                    rowValue.id = matchCharacteristics.id;
                    //handle null value for characteristic
                    if(characteristicValue!=nullCharacteristicsValue){
                        if (multiValueTypes.indexOf(valueType) != -1) {
                            rowValue.multi = true;
                            characteristicValue =  characteristicValue.split(",");
                            var valueIds = [];
                            for (var i = 0; i < characteristicValue.length; i++) {
                                if (valueIds.length == characteristicValue.length) {
                                    break;
                                }
                                for (var j = 0; j < matchCharacteristics.values.length; j++) {
                                    if (characteristicValue[i]==matchCharacteristics.values[j].name) {
                                        valueIds.push(matchCharacteristics.values[i].id);
                                        break;
                                    }
                                }
                            }
                            if (valueIds.length != characteristicValue.length) {
                                cbp(new BadRequestError("File '" + item.originalFilename + ".csv' Line " + lineNumber + " contains invalid characteristicTypeValue(characteristicTypeValue with name="
                                    + characteristicValue + " not exist for characteristic("+matchCharacteristics.name+"))"));
                                return;
                            }
                            rowValue.ids = valueIds;
                        } else {
                            characteristicValue = [characteristicValue];
                        }
                    }
                    cbp();
                }, cb);
            },function(err){
                cbk(err);
            });
        },function (cbk) {
            async.map(smgs, function(item,cb){
                var values=[];
                var characteristicIds =[];
                for(var i=0;i<item.data.length;i++){
                    var characteristicValue = item.data[i].row[0];
                    //handle null value for characteristic
                    if(characteristicValue!=nullCharacteristicsValue) {
                        if (item.data[i].multi) {
                            characteristicValue = item.data[i].ids;
                        }
                        characteristicIds.push(item.data[i].id);
                        values.push({
                            "characteristic": item.data[i].id,
                            "value": characteristicValue
                        });
                    }
                }
                async.waterfall([
                    function (cbj) {
                        //create smg
                        db.models.smg.create({},cbj);
                    },function (entity,cbj) {
                        //create smgCharacteristic
                        async.forEach(values, _createCharacteristic.bind(null, db, entity.id), cbj);
                    }],cb);
            },function(err){
                cbk(err);
            });
        }],function(err){
        callback(err,"Successfully import smg entities!")
    });

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
    search2: wrapExpress("SMG#search2", search2),
    export: wrapExpress("SMG#export", exportSMG,true),
    import:wrapExpress("SMG#import", importSMG)
};