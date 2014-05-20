/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

/**
 * This file represents default data types used for orm2.
 */

module.exports = {
    string: {type: "text", required: true,  big: true},
    optional_string: {type: "text", required: false,  big: true},
    int: {type: "number", required: true,  rational: false},
    bool: {type: "boolean", required: true,  rational: false}
};