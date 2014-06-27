/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * 1. add route /helpTopic/upload
 * 2. add dashboard routes
 */
"use strict";


module.exports = {
    //SMG
    "GET /smgs": "SMG#index",
    "GET /smg/:id": "SMG#show",
    "POST /smg": "SMG#createSingle",
    "POST /smgs": "SMG#createBatch",
    "PUT /smg/:id": "SMG#updateSingle",
    "PUT /smgs": "SMG#updateBatch",
    "DELETE /smg/:id": "SMG#removeSingle",
    "DELETE /smgs": "SMG#removeBatch",
    "POST /exportSMGs": "SMG#export",
    "POST /importSMGs": "SMG#import",
    //Helper topic
    "GET /helpTopic": "HelpTopic#index",
    "GET /helpTopic/:id": "HelpTopic#show",
    "POST /helpTopic": "HelpTopic#create",
    "PUT /helpTopic/:id": "HelpTopic#updateSingle",
    "GET /helpTopic/:id/download": "HelpTopic#download",
    "DELETE /helpTopic/:id": "HelpTopic#removeSingle",
    "DELETE /helpTopic": "HelpTopic#removeBatch",
    "POST /helpTopic/upload": "HelpTopic#uploadFile",

    //Characteristic type
    "GET /characteristicTypes": "CharacteristicType#index",
    "GET /characteristicType/:id": "CharacteristicType#show",
    "POST /characteristicType": "CharacteristicType#createSingle",
    "POST /characteristicTypes": "CharacteristicType#createBatch",
    "PUT /characteristicType/:id": "CharacteristicType#updateSingle",
    "PUT /characteristicTypes": "CharacteristicType#updateBatch",
    "DELETE /characteristicType/:id": "CharacteristicType#removeSingle",
    "DELETE /characteristicTypes": "CharacteristicType#removeBatch",

    //Characteristic
    "GET /characteristics": "Characteristic#index",
    "GET /characteristic/:id": "Characteristic#show",
    "POST /characteristic": "Characteristic#createSingle",
    "POST /characteristics": "Characteristic#createBatch",
    "PUT /characteristic/:id": "Characteristic#updateSingle",
    "PUT /characteristics": "Characteristic#updateBatch",
    "DELETE /characteristic/:id": "Characteristic#removeSingle",
    "DELETE /characteristics": "Characteristic#removeBatch",
    "PUT /characteristic/:id/check": "Characteristic#checkWillAffectSMG",

    //SearchForm
    "GET /searchForms": "SearchForm#index",
    "GET /searchForm/:id": "SearchForm#show",
    "POST /searchForm": "SearchForm#createSingle",
    "POST /searchForms": "SearchForm#createBatch",
    "PUT /searchForm/:id": "SearchForm#updateSingle",
    "PUT /searchForms": "SearchForm#updateBatch",
    "DELETE /searchForm/:id": "SearchForm#removeSingle",
    "DELETE /searchForms": "SearchForm#removeBatch",

    //Search
    "POST /search": "SMG#search",
    "GET /search2": "SMG#search2",

    //Dashboard
    "GET /dashboard": "Dashboard#getDashboard",
    "POST /dashboard": "Dashboard#update"
};