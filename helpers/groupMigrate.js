/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author Sky_
 */
"use strict";

var _ = require('underscore');
var async = require('async');
var BadRequestError = require("../errors/BadRequestError");
var helper = require("./helper");

// group 1: text, textarena
// group 2: picklist, radio
// group 3: checkbox
// group 4: number

/**
 * For each SMGCharacteristics value, add new value entry in the CharacteristicTypeValues
 */
var migrate_1_2 = {
    canMigrate: function (from, to) {
        return from == 1 && to == 2;
    },
    migrate: function (db, characteristic, smgs, callback) {
        var names = [];
        var name2Value = {};
        async.waterfall([
            function (cb) {
                smgs.forEach(function (smg) {
                    if (smg.value && smg.value.length) {
                        names.push(smg.value);
                    }
                });
                var currentNames = _.chain(characteristic.values).pluck("name").value();
                //don't create duplicated names
                var newValues = _.chain(names)
                    .difference(currentNames)
                    .unique()
                    .map(function (name) {
                        return {
                            name: name,
                            characteristic_id: characteristic.id
                        }
                    })
                    .value();
                db.models.characteristicTypeValue.create(newValues, cb);
            }, function (values, cb) {
                values.concat(characteristic.values).forEach(function (v) {
                    name2Value[v.name] = v;
                });
                async.forEach(smgs, function (smg, cbx) {
                    smg.valuetype_id = name2Value[smg.value].id;
                    smg.value = null;
                    smg.save(cbx);
                }, cb);
            }
        ], function (err) {
            callback(err);
        })
    }
};


/**
 * Same as migrate_1_2
 */
var migrate_1_3 = {
    canMigrate: function (from, to) {
        return from == 1 && to == 3;
    },
    migrate: migrate_1_2.migrate
};

/**
 * Convert number, set 0 if can't be converted
 */
var migrate_1_4 = {
    canMigrate: function (from, to) {
        return from == 1 && to == 4;
    },
    migrate: function (db, characteristic, smgs, callback) {
        async.forEach(smgs, function (smg, cb) {
            smg.value = Number(smg.value) || 0;
            smg.save(cb);
        }, callback);
    }
};

/**
 * Store value as string
 */
var migrate_2_1 = {
    canMigrate: function (from, to) {
        return from == 2 && to == 1;
    },
    migrate: function (db, characteristic, smgs, callback) {
        async.series([
            function (cb) {
                async.forEach(smgs, function (smg, cb) {
                    helper.getSingle(smg.valuetype_id, db.models.characteristicTypeValue, function (err, type) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        smg.value = type.name;
                        smg.valuetype_id = null;
                        smg.save(cb);
                    })
                }, cb);
            }, function (cb) {
                db.models.characteristicTypeValue.find({characteristic_id: characteristic.id}).remove(cb);
            }
        ], function (err) {
            callback(err);
        });
    }
};


/**
 * Do nothing, there will be always one checkbox selected
 */
var migrate_2_3 = {
    canMigrate: function (from, to) {
        return from == 2 && to == 3;
    },
    migrate: function (db, characteristic, smgs, callback) {
        callback();
    }
};


/**
 * Parse the value, if it is valid number we store it, if not set to 0
 */
var migrate_2_4 = {
    canMigrate: function (from, to) {
        return from == 2 && to == 4;
    },
    migrate: function (db, characteristic, smgs, callback) {
        async.series([
            function (cb) {
                async.forEach(smgs, function (smg, cb) {
                    helper.getSingle(smg.valuetype_id, db.models.characteristicTypeValue, function (err, type) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        smg.value = Number(type.name) || 0;
                        smg.valuetype_id = null;
                        smg.save(cb);
                    })
                }, cb);
            }, function (cb) {
                db.models.characteristicTypeValue.find({characteristic_id: characteristic.id}).remove(cb);
            }
        ], function (err) {
            callback(err);
        });
    }
};


/**
 * Separate values by comma and keep as string
 */
var migrate_3_1 = {
    canMigrate: function (from, to) {
        return from == 3 && to == 1;
    },
    migrate: function (db, characteristic, smgs, callback) {
        async.series([
            function (cb) {
                var groups = _.groupBy(smgs, "smg_id");

                async.forEach(_.values(groups), function (group, cb) {
                    var first = group[0];
                    async.waterfall([
                        function (cb) {
                            async.map(group, function (smg, cb) {
                                helper.getSingle(smg.valuetype_id, db.models.characteristicTypeValue, cb);
                            }, cb);
                        }, function (types, cb) {
                            var names = _.pluck(types, 'name');
                            names.sort();
                            var value = names.join(', ');
                            first.value = value;
                            first.valuetype_id = null;
                            first.save(cb);
                        }, function (ele, cb) {
                            async.forEach(group.slice(1), function (smg, cb) {
                                smg.remove(cb);
                            }, cb);
                        }
                    ], cb);
                }, cb);
            }, function (cb) {
                db.models.characteristicTypeValue.find({characteristic_id: characteristic.id}).remove(cb);
            }
        ], function (err) {
            callback(err);
        });
    }
};


/**
 * Keep only single selected value
 */
var migrate_3_2 = {
    canMigrate: function (from, to) {
        return from == 3 && to == 2;
    },
    migrate: function (db, characteristic, smgs, callback) {
        var map = {};
        async.forEachSeries(smgs, function (smg, cb) {
            if (map[smg.smg_id]) {
                smg.remove(cb);
            } else {
                map[smg.smg_id] = true;
                cb();
            }
        }, callback);

    }
};

/**
 * Try cast to number, if fail set 0
 */
var migrate_3_4 = {
    canMigrate: function (from, to) {
        return from == 3 && to == 4;
    },
    migrate: function (db, characteristic, smgs, callback) {
        async.waterfall([
            function (cb) {
                //cast to strings
                migrate_3_1.migrate(db, characteristic, smgs, cb);
            }, function (cb) {
                db.models.smgCharacteristic.find({characteristic_id: characteristic.id}, cb);
            }, function (smgs, cb) {
                //cast to numbers
                migrate_1_4.migrate(db, characteristic, smgs, cb);
            }
        ], callback);
    }
};

/**
 * Do nothing, because numbers are stored as string in db
 */
var migrate_4_1 = {
    canMigrate: function (from, to) {
        return from == 4 && to == 1;
    },
    migrate: function (db, characteristic, smgs, callback) {
        callback();
    }
};



/**
 * Same as migrate_1_2
 */
var migrate_4_2 = {
    canMigrate: function (from, to) {
        return from == 4 && to == 2;
    },
    migrate: migrate_1_2.migrate
};

/**
 * Same as migrate_1_2
 */
var migrate_4_3 = {
    canMigrate: function (from, to) {
        return from == 4 && to == 3;
    },
    migrate: migrate_1_2.migrate
};

/**
 * Migrate characteristic from and group to other and fix All SMGCharacteristics
 * @param {Object} db the database instance
 * @param {Number} characteristicId the characteristic id
 * @param {Number} from the number of group to migrate from
 * @param {Number} to the number of group to migrate to
 * @param {Function<err>} callback the callback function
 */
function migrate(db, characteristicId, from, to, callback) {
    var migrators = [migrate_1_2, migrate_1_3, migrate_1_4, migrate_2_1, migrate_2_3,
        migrate_2_4, migrate_3_1, migrate_3_2, migrate_3_4, migrate_4_1, migrate_4_2, migrate_4_3];

    var characteristic, migrator;
    for(var i = 0; i < migrators.length; i++) {
        var m = migrators[i];
        if (m.canMigrate(from, to)) {
            migrator = m;
            break;
        }
    }
    if (!migrator) {
        callback(new BadRequestError("Can't migrate from group " + from + " to " + to + ". Operation not supported."));
        return;
    }
    async.waterfall([
        function (cb) {
            helper.getSingle(characteristicId, db.models.characteristic, cb);
        }, function (res, cb) {
            characteristic = res;
            characteristic.getValues(cb);
        }, function (res, cb) {
            db.models.smgCharacteristic.find({characteristic_id: characteristic.id}, cb);
        }, function (smgs, cb) {
            if (migrator.migrate.length === 6) {
                migrator.migrate(db, characteristic, smgs, from, to, cb);
            } else {
                migrator.migrate(db, characteristic, smgs, cb);
            }
        }
    ], callback);
}

module.exports = migrate;