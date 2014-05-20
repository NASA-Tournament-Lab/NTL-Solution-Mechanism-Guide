/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";
var Path = require('path');

module.exports = {
    database: {
        host     : process.env.DB_HOST,
        database : process.env.DB_NAME,
        protocol : 'mysql',
        port     : process.env.DB_PORT || '3306',
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        query    : { pool: true }
    },
    reset_tables: process.env.RESET_TABLES === "true",
    downloadsDir: process.env.DOWNLOADS_DIR || Path.join(__dirname, "../downloads"),

    routes: require("./routes")
};