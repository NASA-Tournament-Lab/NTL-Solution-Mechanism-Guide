/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var validator = require('rox').validator;

/**
 * Define a global function used for validation. Controller method should only use this function.
 * @param {Object} input the object to validate
 * @param {Object} definition the definition object. Refer to rox module for more details.
 * @param {String} [prefix] the prefix for error message.
 * @returns {Error} error if validation failed or null if validation passed.
 */
function validate(input, definition, prefix) {
    var error = validator.validate(prefix || "prefix-to-remove", input, definition);
    if (!error) {
        return null;
    }
    //remove prefix in error message
    error.message = error.message.replace("prefix-to-remove.", "");
    //if input is invalid then change the name to input
    error.message = error.message.replace("prefix-to-remove", "input");
    return error;
}


var MAX_INT = 2147483647;

//register here some useful aliases
//? means value is optional (not defined), but can't equal null
//null- prefix means value can equal null

//database id
validator.registerAlias("id", {type: "Integer", min: 1, max: MAX_INT});
validator.registerAlias("id?", {type: "id", required: false});
validator.registerAlias("null-id?", {type: "id", required: false, nullable: true});
//non-negative integer
validator.registerAlias("int+", {type: "Integer", min: 0, max: MAX_INT});
validator.registerAlias("int+?", {type: "int+", required: false});
validator.registerAlias("stringInt+", {type: "Integer", min: 0, max: MAX_INT, castString: true});
validator.registerAlias("stringInt+?", {type: "Integer", min: 0, max: MAX_INT, castString: true, required: false});
//id can be string number e.g "123"
validator.registerAlias("stringId", {type: "Integer", castString: true, min: 1, max: MAX_INT});
validator.registerAlias("stringId?", {type: "Integer", required: false, castString: true, min: 1, max: MAX_INT});
validator.registerAlias("null-stringId?", {type: "Integer", required: false, castString: true, min: 1, max: MAX_INT, nullable: true});
validator.registerAlias("string?", {type: String, required: false});
validator.registerAlias("null-string?", {type: String, required: false, nullable: true});
validator.registerAlias("bool?", {type: "bool", required: false});


validator.registerType({
    name: "value",
    validate: function (name, value, params, validator) {
        var notString = validator.validate(name, value, "string"),
            notArray = validator.validate(name, value, [{type: "Integer", min: 1, max: MAX_INT}]);
        if (notString && notArray) {
            return new Error(name + " should be a string or an array of ids");
        }
        return null;
    }
});


module.exports = {
    validate: validate
};