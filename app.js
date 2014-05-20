/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. create routes for frontend views
 */
"use strict";

/**
 * Module dependencies.
 */
require("./helpers/validator");
var config = require('./config/configuration');
var async = require('async');
var _ = require('underscore');
var express = require('express');
var http = require('http');
var winston = require('winston');
var initDb = require('./db');

var app = express();

require('./config')(app);

var baseURL = '/api';

initDb(function (err, db) {
    if (err) {
        throw err;
    }
    global.db = db;
    //load all routes
    var route, value;
    for (route in config.routes) {
        if (config.routes.hasOwnProperty(route)) {
            value = config.routes[route];
            var method = route.split(' ').shift().toLowerCase(),
                url = baseURL + route.split(' ').pop(),
                controllerName = value.split('#').shift(),
                action = value.split('#').pop(),
                controller = require('./controllers/' + controllerName);
            app[method](url, controller[action]);
        }
    }

    http.createServer(app).listen(app.get('port'), function () {
        winston.info('Express server listening on port ' + app.get('port'));
    });
}, config.reset_tables);



//mapping for html pages
var urlMapping = {
    "/home": {
        //mapping name
        name: "home",
        //template name under /views/ directory
        template: "home",
        //name of selected menu
        menu: "home",
        //flag if admin, admin has only different menu
        admin: false
    },
    "/": {
        name: "prelogin",
        template: "prelogin"
    },
    "/examples": {
        name: "examples",
        template: "examples",
        menu: "examples"
    },
    "/example/:smg/:id": {
        name: "exampleDetails",
        template: "example",
        menu: "examples"
    },
    "/help": {
        name: "help",
        template: "help",
        menu: "help"
    },
    "/help/:id": {
        name: "helpDetails",
        template: "helpDetails",
        menu: "help"
    },
    "/admin/help": {
        name: "adminHelp",
        template: "admin/help",
        menu: "help",
        admin: true
    },
    "/admin/help/add": {
        name: "adminAddHelp",
        template: "admin/addOrEditHelp",
        menu: "help",
        admin: true
    },
    "/admin/help/edit/:id": {
        name: "adminEditHelp",
        template: "admin/addOrEditHelp",
        menu: "help",
        admin: true
    },
    "/smg": {
        name: "smgListing",
        menu: "home",
        template: "smg"
    },
    "/smg/:id": {
        name: "smgDetails",
        menu: "home",
        template: "smgDetails.ejs"
    },
    "/compare/:left/:right": {
        name: "smgCompare",
        menu: "home",
        template: "smgCompare.ejs"
    },
    "/admin/smg/create": {
        name: "createSmg",
        menu: "smg",
        template: "admin/addEditSmg.ejs",
        admin: true
    },
    "/admin/smg": {
        name: "smg",
        menu: "smg",
        template: "admin/smg.ejs",
        admin: true
    },
    "/admin/smg/:id": {
        name: "smgDetails",
        menu: "smg",
        template: "admin/smgDetails.ejs",
        admin: true
    },
    "/admin/smg/edit/:id": {
        name: "editSmg",
        menu: "smg",
        template: "admin/addEditSmg.ejs",
        admin: true
    },
    "/admin/characteristics": {
        name: "characteristics",
        menu: "characteristics",
        template: "admin/characteristics.ejs",
        admin: true
    },
    "/admin/forms": {
        name: "forms",
        menu: "forms",
        template: "admin/forms.ejs",
        admin: true
    },
    "/admin/forms/create": {
        name: "createForm",
        menu: "forms",
        template: "admin/addEditForm.ejs",
        admin: true
    },
    "/admin/forms/:id": {
        name: "editForm",
        menu: "forms",
        template: "admin/addEditForm.ejs",
        admin: true
    },
};

//create express router for each url
Object.keys(urlMapping).forEach(function (url) {
    var params = urlMapping[url];
    app.get(url, function (req, res) {
        //params in URL e.g. /examples/:id
        var urlParams = {};
        Object.keys(req.params).forEach(function (p) {
            urlParams[p] = req.params[p];
        });
        res.render(params.template, {
            username: req.headers['x-iisnode-logon_user'] || "domain/unknown",//if running as non IIS app
            name: params.name,
            urlParams: urlParams,
            menu: params.menu,
            admin: params.admin
        });
    });
});