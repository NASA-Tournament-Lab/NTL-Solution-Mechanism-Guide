/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */

/**
 * Base API URL
 */
var API_URL = "/api";

/**
 * Characteristic types, number represent ID
 */
var chTypes = {
    checkbox: 1,
    number: 2,
    picklist: 3,
    radio: 4,
    text: 5,
    textarea: 6
};

/**
 * Allowed tabs for characteristics
 */
var chTabs = ["Information", "How to start"];

/**
 * Base characteristic Ids that cannot be removed
 */
var chIds = {
    name: 1,
    desc: 2,
    aka: 3,
    type: 4,
    duration: 5,
    cost: 6
};

if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

if (!Array.prototype.indexOf)
{
    Array.prototype.indexOf = function(elt /*, from*/)
    {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0)
            ? Math.ceil(from)
            : Math.floor(from);
        if (from < 0)
            from += len;

        for (; from < len; from++)
        {
            if (from in this &&
                this[from] === elt)
                return from;
        }
        return -1;
    };
}

/**
 * Add fake timeout to see loader
 * @param {function } fn the function to execute
 */
function fakeTimeout(fn) {
    setTimeout(fn, 500);
}


/**
 * Handle error response from API
 * @param {Object} response the ajax response
 */
function handleError(response) {
    unBlockUI();
    alert("ERROR OCCURRED: \n" + response.responseJSON ? response.responseJSON.details : response.responseText);
}


/**
 * Get JSON response from API. Random parameter is added to query string to prevent caching
 * @param {String} url the url to get
 * @param {Function} callback the callback function when success
 * @param {Function} errorCallback the error callback, if not set default error handler is used
 */
function getJSON(url, callback, errorCallback) {
    if (url.indexOf('?') === -1) {
        url += "?";
    } else {
        url += "&";
    }
    url += "_t=" + new Date().getTime();
    $.getJSON(url, callback).error(errorCallback || handleError);
}


/**
 * Show custom alert with OK button
 * @param {String} text the text to show
 * @param {Function} onClose the callback when popup is closed
 */
function showAlert(text, onClose) {
    var $popup = $('#alert-popup').clone();
    $popup.find('.popup-form span').text(text);
    $popup.find('.ok, .tooltip-close').click(function () {
        $popup.remove();
        $("#modal-window-bg").hide();
        if (onClose) {
            onClose();
        }
    });
    $popup.appendTo($('body'));
    showModal($popup);
}


/**
 * Show custom confirmation dialog with OK and NO buttons
 * @param {String} text the text to show
 * @param {Function} onOk the callback when Yes button is clicked
 * @param {Function} onClose the callback when popup is closed (X icon or NO button)
 */
function showConfirm(text, onOk, onClose) {
    var $popup = $('#confirm-popup').clone();
    $popup.find('.popup-form span').text(text);
    $popup.find('.no-btn, .tooltip-close').click(function () {
        $popup.remove();
        $("#modal-window-bg").hide();
        if (onClose) {
            onClose();
        }
    });
    $popup.find('.yes-btn').click(function () {
        $popup.remove();
        $("#modal-window-bg").hide();
        if (onOk) {
            onOk();
        }
    });
    $popup.appendTo($('body'));
    showModal($popup);
}


/**
 * Get characteristic value for given smg
 * @param {Object} smg the smg
 * @param {Number} id the characteristic id
 * @returns {String} the value of characteristic
 */
function getSMGValue(smg, id) {
    var ret = null;
    _.each(smg.smgCharacteristics, function (item) {
        if (item.characteristic_id != id) {
            return;
        }
        if (item.valueType) {
            ret = item.valueType.name;
        } else {
            ret = item.value;
        }
    });
    return ret;
}

//setup validation plugin
ko.validation.init({
    errorClass: "is-error",
    decorateElement : true,
    messageTemplate: "errorMessageIcon"
});


/**
 * Animate loader image
 * @param {Object} obj the target html element
 * @param {Number} height the height of element
 */
var animateObject = function (obj, height) {
    var preloaderTimer = obj.data('timer');
    if (preloaderTimer) {
        clearInterval(preloaderTimer);
        obj.data('timer', null);
    }
    var fps = 16;
    var fpsTimer = 50;
    var counter = 0;
    preloaderTimer = setInterval(function(){
        if(counter >= fps) counter = 0;
        obj.css({backgroundPositionY: eval(-counter*height)+"px"});
        counter++;
    }, fpsTimer);
    obj.data('timer', preloaderTimer);
};


/**
 * Format Cost with 'k' or 'M' suffix
 * @param number
 */
function formatCost(number) {
    if (number > 1000000) {
        return Math.floor(number / 1000000) + "M";
    }
    if (number > 1000) {
        return Math.floor(number / 1000) + "k";
    }
    return number;
}

/**
 * Add pagination properties and methods to the given view
 * @param {Object} view the view
 */
function initPagination(view) {
    view.page = ko.observable(1);
    view.pageSize = ko.observable(5);
    view.pageSize.subscribe(function () {
        view.page(1);
    });
    view.availablePageSizes = [5, 10, 20];
    view.total = ko.computed(function () {
        return view.items().length;
    });
    view.totalPages = ko.computed(function () {
        return Math.ceil(view.total() / view.pageSize());
    });
    view.items.subscribe(function () {
        if (view.page() > view.totalPages() && view.totalPages() !== 0) {
            view.page(view.totalPages());
        }
    });
    view.canPrevPage = ko.computed(function () {
        return view.page() > 1;
    });
    view.canNextPage = ko.computed(function () {
        return view.page() !== view.totalPages() && view.totalPages() !== 0;
    });
    view.prevPage = function () {
        if (view.canPrevPage()) {
            view.page(view.page() - 1);
        }
    };
    view.nextPage = function () {
        if (view.canNextPage()) {
            view.page(view.page() + 1);
        }
    };
    view.pagedItems = ko.computed(function () {
        var offset = (view.page() - 1) * view.pageSize();
        var limit = view.pageSize();
        return view.items().slice(offset, offset + limit);
    });
    view.paginatorText = ko.computed(function () {
        var start = (view.page() - 1) * view.pageSize() + 1;
        if (view.total() === 0) {
            start = 0;
        }
        var end = Math.min(view.total(), start + view.pageSize() - 1);
        return "Displaying " + start + " - " + end + " of " + view.total() + " Result" + (view.total() === 1 ? "" : "s");
    });
}

//number validator
ko.validation.rules.number = {
    validator: function (val) {
        if (!val) {
            return true;
        }
        return $.isNumeric(Number(val));
    },
    message: 'Number required.'
};
ko.validation.registerExtenders();


/**
 * View model for characteristics
 * @constructor
 */
function ManageCharacteristicsViewModel() {
    var self = this;
    //true if loading data
    self.loading = ko.observable(true);
    //list of all characteristc items
    self.allItems = ko.observableArray([]);
    //used in paginator
    self.items = ko.computed(function () {
        var ret = self.allItems();
        ret.sort(function (a, b) {
            return a.id - b.id;
        });
        return ret;
    });
    //allowed characteristic types
    self.types = ko.observableArray([]);
    initPagination(self);
    fakeTimeout(function () {
        async.parallel([
            function (cb) {
                getJSON(API_URL + "/characteristics", function (ret) {
                    self.allItems(ret);
                    cb();
                });
            }, function (cb) {
                getJSON(API_URL + "/characteristicTypes", function (ret) {
                    self.types(ret);
                    cb();
                });
            }
        ], function () {
            self.loading(false);
        });
    });
    //create popup is visible
    self.creatingOrEditing = ko.observable(false);
    //used in confirmation popup only
    self.isEditing = ko.observable(false);
    //create/edit in progress (ajax call)
    self.submitting = ko.observable(false);
    var initCharToCreateOrEdit = function () {
        self.newCharacteristic = ko.observable({
            name: ko.observable().extend({required: true}),
            tab: ko.observable().extend({required: true}),
            description: ko.observable().extend({required: true}),
            type: ko.observable().extend({required: true}),
            values: ko.observableArray([{val: ""}, {val: ""}, {val: ""}])
        });
        self.newCharacteristic().addValue = function () {
            self.newCharacteristic().values.push({val: ""});
        };
        self.newCharacteristic().removeValue = function (ele) {
            self.newCharacteristic().values.remove(ele);
        };
        self.errors = ko.validation.group(self.newCharacteristic(), { deep: true });
    };

    self.addNewCharacteristic = function () {
        initCharToCreateOrEdit();
        self.creatingOrEditing(true);
        showModal($('#add-popup'));
    };
    self.closeAddPopup = function () {
        self.submitting(false);
        self.creatingOrEditing(false);
        self.editingItem(null);
        clearAnimation($('#add-popup .js-add-loader'));
        hideModal($('#add-popup'));
    };

    self.editingItem = ko.observable();
    self.startEdit = function (item) {
        initCharToCreateOrEdit();
        self.editingItem(item);
        self.newCharacteristic().name(item.name);
        self.newCharacteristic().tab(item.tab);
        self.newCharacteristic().description(item.description);
        self.newCharacteristic().type(item.type_id);
        self.newCharacteristic().values(_.map(item.values, function (ele) {
            return { val: ele.name};
        }));
        for (var i = self.newCharacteristic().values().length; i < 3; i += 1) {
            self.newCharacteristic().values.push({val: ""});
        }
        self.creatingOrEditing(true);
        showModal($("#add-popup"));
    };
    //create new or edit selected
    self.createNewCharacteristic = function () {
        var newChar = self.newCharacteristic();
        self.errors.showAllMessages();
        if (self.errors().length) {
            return;
        }
        var values = _.chain(newChar.values())
            .pluck('val')
            .filter(function (ele) {
                return ele.trim().length;
            })
            .value();
        if ([chTypes.picklist, chTypes.radio].indexOf(newChar.type()) !== -1) {
            if (!values.length) {
                alert('At least one non-empty value is required.');
                return;
            }
        } else {
            values = [];
        }
        var nextSort = _.chain(self.allItems())
            .filter(function (ele) {
                return ele.tab === newChar.tab()
            })
            .pluck("sort")
            .max(function (ele) {
                return ele;
            })
            .value() + 1;
        if (nextSort === -Infinity) {
            nextSort = 1;
        }
        if (self.editingItem()) {
            //change sort only if tab was changed
            if (newChar.tab() === self.editingItem().tab) {
                nextSort = self.editingItem().sort;
            }
        }
        if (self.submitting()) {
            return;
        }
        self.submitting(true);
        animateObject($('#add-popup .js-add-loader'), 21);
        var data = JSON.stringify({
            name: newChar.name(),
            description: newChar.description(),
            type_id: newChar.type(),
            values: values.length ? _.map(values, function (ele) {
                return {name: ele}
            }) : undefined,
            tab: newChar.tab(),
            sort: nextSort
        });
        var onError = function (response) {
            handleError(response);
            self.closeAddPopup();
        };
        fakeTimeout(function () {
            if (self.editingItem()) {
                self.isEditing(true);
                var item = self.editingItem();
                $.ajax({
                    type: "put",
                    url: API_URL + "/characteristic/" + item.id,
                    contentType: 'application/json',
                    data: data,
                    success: function (ret) {
                        self.allItems.remove(item);
                        self.allItems.push(ret);
                        self.closeAddPopup();
                        showAlert('Characteristic Has Been Saved');
                    },
                    error: onError,
                    dataType: "json"
                });
            } else {
                self.isEditing(false);
                $.ajax({
                    type: "post",
                    url: API_URL + "/characteristic",
                    contentType: 'application/json',
                    data: data,
                    success: function (ret) {
                        self.allItems.push(ret);
                        self.closeAddPopup();
                        showAlert('Characteristic Has Been Added');
                    },
                    error: onError,
                    dataType: "json"
                });
            }
        });
    };
    self.remove = function (item) {
        if (_.values(chIds).indexOf(item.id) != -1) {
            showAlert("This characteristic cannot be deleted.");
            return;
        }
        showConfirm("Are you sure you want to delete this item?", function () {
            blockUI();
            fakeTimeout(function () {
                $.ajax({
                    type: "delete",
                    url: API_URL + "/characteristic/" + item.id,
                    success: function () {
                        self.allItems.remove(item);
                        unBlockUI();
                    },
                    error: function (response) {
                        handleError(response);
                    },
                    dataType: "json"
                });
            })
        });
    };
}

/**
 * View model for smg create/edit
 * @constructor
 */
function AddEditSMGViewModel() {
    var self = this;
    //true if loading data
    self.loading = ko.observable(true);
    self.characteristics = ko.observableArray([]);
    self.step = ko.observable(1);
    self.examples = ko.observableArray([{value: ko.observable("")}]);
    //non empty examples
    self.exampleValues = ko.computed(function () {
        var values = _.map(self.examples(), function (ele) {
            return ele.value();
        });
        return _.filter(values, function (v) {
            return $('<div></div>').html(v).text().trim().length;
        });
    });
    self.step1Items = ko.computed(function () {
        return _.filter(self.characteristics(), function (item) {
            return item.tab === chTabs[0]
        })
    });
    self.step3Items = ko.computed(function () {
        return _.filter(self.characteristics(), function (item) {
            return item.tab === chTabs[1]
        })
    });
    blockUI();
    self.loaded = ko.observable(false);
    self.edit = ko.observable(false);
    self.editId = ko.observable();
    fakeTimeout(function () {
        async.series([
            function (cb) {
                getJSON(API_URL + "/characteristics", function (ret) {
                    var items = _.map(ret, function (item) {
                        var extend = {
                            required: {
                                    onlyIf: function () {
                                        return (item.tab === chTabs[0] && self.step() == 1) ||
                                            (item.tab === chTabs[1] && self.step() == 3);
                                    }
                            }
                        };
                        if (item.type_id == chTypes.number) {
                            extend.number = true;
                        }
                        item.value = ko.observable().extend(extend);
                        item.displayValue = ko.computed(function () {
                            var val = item.value();
                            if (val && val.name) {
                                return val.name
                            }
                            return val;
                        });
                        return item;
                    });
                    self.characteristics(items);
                    self.errorsTab1 = ko.validation.group(self.step1Items(), { deep: true });
                    self.errorsTab3 = ko.validation.group(self.step3Items(), { deep: true });
                    cb();
                });
            }, function (cb) {
                var id = urlParams.id;
                if (!id) {
                    cb();
                    return;
                }
                self.edit(true);
                self.editId(Number(id));
                getJSON(API_URL + "/smg/" + id, function (ret) {
                    _.each(ret.smgCharacteristics, function (currentCh) {
                        _.each(self.characteristics(), function (ch) {
                            if (currentCh.characteristic_id != ch.id) {
                                return;
                            }
                            var val;
                            if (ch.type_id == chTypes.picklist || ch.type_id == chTypes.radio) {
                                val = _.filter(ch.values, function (v) {
                                    return v.id == currentCh.valuetype_id
                                })[0];
                            } else {
                                val = currentCh.value;
                            }
                            ch.value(val);
                        });
                    });
                    self.examples(_.map(ret.examples, function (item) {
                        return {
                            value: ko.observable(item.description)
                        };
                    }));
                    cb();
                });
            }
        ], function () {
            self.loading(false);
            self.loaded(true);
            unBlockUI();
        });
    });
    self.nextStep = function () {
        var step = self.step();
        if (step == 1) {
            self.errorsTab1.showAllMessages();
            if (self.errorsTab1().length) {
                return;
            }
        }
        if (step == 3) {
            self.errorsTab3.showAllMessages();
            if (self.errorsTab3().length) {
                return;
            }
        }

        if (step === 2) {
            var values = self.exampleValues();
            if (!values.length) {
                alert('At least one example is required (non-empty value)');
                return;
            }
            self.step(self.step() + 1);
            return;
        }
        self.step(self.step() + 1);
    };
    self.prevStep = function () {
        self.step(self.step() - 1);
    };

    self.addExample = function () {
        self.examples.push({value: ko.observable("")});
    };

    self.goToStep = function (step) {
        if (step < self.step()) {
            self.step(step);
        }
    };
    self.cancel = function () {
        showConfirm("Are you sure you want to cancel?", function () {
            window.location.href = "/admin/smg";
        });
    };
    self.finish = function () {
        var data = {
            characteristics: _.map(self.characteristics(), function (item) {
                var val = item.value();
                if (item.type_id == chTypes.picklist || item.type_id == chTypes.radio) {
                    val = [val.id];
                }
                return {
                    characteristic: item.id,
                    value: val
                };
            }),
            examples: _.map(self.exampleValues(), function (item) {
                return {
                    description: item
                }
            })
        };
        blockUI();
        fakeTimeout(function () {
            if (self.edit()) {
                $.ajax({
                    type: "put",
                    url: API_URL + "/smg/" + self.editId(),
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function () {
                        unBlockUI();
                        showAlert("Changes have been saved", function () {
                            window.location.href = "/admin/smg";
                        });
                    },
                    error: handleError,
                    dataType: "json"
                });
            } else {
                $.ajax({
                    type: "post",
                    url: API_URL + "/smg",
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function () {
                        unBlockUI();
                        showAlert("New solution has been added successfully", function () {
                            window.location.href = "/admin/smg";
                        });
                    },
                    error: handleError,
                    dataType: "json"
                });
            }
        });
    };
}

/**
 * View model for smg listing for admin
 * @constructor
 */
function AdminSMGViewModel() {
    var self = this;
    self.allItems = ko.observableArray([]);
    self.items = ko.computed(function () {
        var ret = self.allItems();
        ret.sort(function (a, b) {
            return a.id - b.id;
        });
        return ret;
    });
    //allowed characteristic types
    self.types = ko.observableArray([]);
    initPagination(self);
    self.searchFilter = {
        name: ko.observable(""),
        aka: ko.observable(""),
        desc: ko.observable("")
    };
    self.loading = ko.observable(true);
    self.hasSearchError = ko.observable(false);
    self.search = function () {
        var criteria = [
            {characteristic: chIds.name, value: self.searchFilter.name().trim() || "%"},
            {characteristic: chIds.aka, value: self.searchFilter.aka().trim() || "%"},
            {characteristic: chIds.desc, value: self.searchFilter.desc().trim() || "%"}
        ];
        self.loading(true);
        var onError = function (response) {
            handleError(response);
            self.loading(false);
        };
        fakeTimeout(function () {
            $.ajax({
                type: "post",
                url: API_URL + "/search",
                contentType: 'application/json',
                data: JSON.stringify(criteria),
                success: function (ret) {
                    var items = _.map(ret, function (item) {
                        var getChar = function (id) {
                            var foundChar =_.filter(item.smgCharacteristics, function (ch) {
                                return ch.characteristic_id == id
                            })[0];
                            if (foundChar) {
                                return foundChar.value;
                            }
                            return "";
                        };
                        return {
                            id: item.id,
                            name: getChar(chIds.name),
                            desc: getChar(chIds.desc),
                            aka: getChar(chIds.aka)
                        }
                    });
                    self.allItems(items);
                    self.loading(false);
                },
                error: onError,
                dataType: "json"
            });
        });
    };

    self.deleteSmg = function (item) {
        showConfirm("Are you sure want to delete this solution?", function () {
            blockUI();
            fakeTimeout(function () {
                $.ajax({
                    type: "delete",
                    url: API_URL + "/smg/" + item.id,
                    success: function () {
                        self.allItems.remove(item);
                        unBlockUI();
                    },
                    error: handleError,
                    dataType: "json"
                });
            });
        });
    };

    //initial data load
    self.search();
}

/**
 * View model for search form listing
 * @constructor
 */
function FormFilterViewModel() {
    var root = this, self = this;
    self.name = ko.observable("").extend({required: true});
    self.errors = ko.validation.group(self, { deep: true });
    self.fields = ko.observableArray([]);
    self.fieldsSorted = ko.computed(function () {
       var ret = self.fields();
        ret.sort(function (a, b) {
            return a.sort() - b.sort();
        });
        return ret;
    });
    self.characteristics = ko.observableArray([]);
    self.saving = ko.observable(false);
    self.edit = ko.observable(false);
    self.editId = ko.observable();
    self.loading = ko.observable(true);

    var id = urlParams.id;
    if (id) {
        self.edit(true);
        self.editId(Number(id));
    }

    fakeTimeout(function () {
            async.series([
                function (cb) {
                    getJSON(API_URL + "/characteristics", function (ret) {
                        self.characteristics(ret);
                        cb();
                    });
                }, function (cb) {
                    if (!self.edit()) {
                        cb();
                        return;
                    }
                    getJSON(API_URL + "/searchForm/" + self.editId(), function (ret) {
                        self.name(ret.name);
                        _.each(ret.fields, function (field) {
                            _.each(self.characteristics(), function (ch) {
                                if (field.characteristic_id != ch.id) {
                                    return;
                                }
                                var model = new FieldModel();
                                model.characteristic(ch);
                                model.values(_.compact(_.pluck(field.values, "valuetype_id")));
                                model.sort(field.sort);
                                self.fields.push(model)
                            });
                        });
                        cb();
                    });
                }
            ], function () {
                self.loading(false);
            });
    });

    self.newField = {
        characteristic: ko.observable(),
        value: ko.observable(""),
        values: ko.observableArray([])
    };
    self.showAddNewPopup = function () {
        self.editingField(null);
        self.newField.characteristic(null);
        self.newField.value("");
        self.newField.values([]);
        showModal($('#add-search-popup'));
    };
    self.startEdit = function (item) {
        self.editingField(item);
        self.newField.characteristic(item.characteristic());
        self.newField.value(item.value());
        self.newField.values(item.values());
        showModal($('#add-search-popup'));
    };

    var FieldModel = function () {
        var self = this;
        self.characteristic = ko.observable();
        self.value = ko.observable();
        self.sort = ko.observable();
        self.values = ko.observableArray([]);
        self.displayValues = ko.computed(function () {
            if (self.values().length && self.characteristic()) {
                return _.chain(self.characteristic().values)
                    .filter(function (item) {
                        return self.values().indexOf(item.id) != -1
                    })
                    .map(function (item) {
                        return item.name;
                    })
                    .value();
            }
            return [];
        });
        self.canMoveUp = ko.computed(function () {
            return root.fieldsSorted().indexOf(self) != 0;
        });
        self.canMoveDown = ko.computed(function () {
            return root.fieldsSorted().length > 1 && root.fieldsSorted().indexOf(self) + 1 != root.fieldsSorted().length;
        });
        self.moveUp = function () {
            if (!self.canMoveUp()) {
                return;
            }
            var index = root.fieldsSorted().indexOf(self);
            var swap = root.fieldsSorted()[index - 1];
            var tmp = swap.sort();
            swap.sort(self.sort());
            self.sort(tmp);
        };
        self.moveDown = function () {
            if (!self.canMoveDown()) {
                return;
            }
            var index = root.fieldsSorted().indexOf(self);
            var swap = root.fieldsSorted()[index + 1];
            var tmp = swap.sort();
            swap.sort(self.sort());
            self.sort(tmp);
        }
    };

    self.editingField = ko.observable();

    self.addNew = function () {
        var field = self.editingField() || new FieldModel();
        field.characteristic(self.newField.characteristic());
        var nextSort = 1;

        if (!self.editingField()) {
            if (self.fields().length) {
                nextSort = _.max(self.fields(), function (item) {
                    return item.sort();
                }).sort() + 1
            }
            field.sort(nextSort);
        }
        if ([chTypes.radio, chTypes.picklist].indexOf(self.newField.characteristic().type_id) != -1) {
            if (!self.newField.values().length) {
                alert('Please select at least one value');
                return
            }
            field.values(self.newField.values());
            field.value(null);
        }

        if (!self.editingField()) {
            self.fields.push(field);
        }
        hideModal($('#add-search-popup'));
    };

    self.deletingItem = ko.observable();
    self.remove = function (item) {
        showConfirm("Are you sure want to delete this item?", function () {
            self.fields.remove(item);
        });
    };

    self.save = function () {
        self.errors.showAllMessages();
        if (self.errors().length) {
            return;
        }
        if (!self.fields().length) {
            alert('At least one search parameter is required');
            return;
        }

        blockUI();
        var data = {
            name: self.name(),
            description: "filter",
            fields: _.map(self.fieldsSorted(), function (item) {
                return {
                    characteristic: item.characteristic().id,
                    value: item.values().length ? item.values() : "value",
                    sort: item.sort()
                }
            })
        };
        fakeTimeout(function () {
            if (self.edit()) {
                $.ajax({
                    type: "put",
                    url: API_URL + "/searchForm/" + self.editId(),
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function (ret) {
                        unBlockUI();
                        showAlert("Changes have been saved", function () {
                            window.location.href = "/admin/forms";
                        })
                    },
                    error: handleError,
                    dataType: "json"
                });
            } else {
                $.ajax({
                    type: "post",
                    url: API_URL + "/searchForm",
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function (ret) {
                        unBlockUI();
                        showAlert("Filter form has been created!", function () {
                            window.location.href = "/admin/forms";
                        })
                    },
                    error: handleError,
                    dataType: "json"
                });
            }
        });
    }
}

/**
 * View model for search form details
 * @constructor
 */
function FormFilterListingViewModel() {
    var self = this;
    self.items = ko.observableArray([]);
    self.activeId = ko.observable();
    self.loading = ko.observable(true);
    self.activeId.subscribe(function (id) {
        $.ajax({
            type: "put",
            url: API_URL + "/searchForm/" + id,
            contentType: 'application/json',
            data: JSON.stringify({active: true}),
            error: handleError,
            dataType: "json"
        });
    });
    fakeTimeout(function () {
        getJSON(API_URL + "/searchForms", function (ret) {
            self.items(ret);
            _.each(ret, function (item) {
                if (item.active) {
                    self.activeId(String(item.id));
                }
            });
            self.loading(false);
        });
    });
    self.remove = function (item) {
        showConfirm("Are you sure want to delete the filter form " + item.name + "?", function () {
            blockUI();
            fakeTimeout(function () {
                $.ajax({
                    type: "delete",
                    url: API_URL + "/searchForm/" + item.id,
                    contentType: 'application/json',
                    success: function () {
                        self.items.remove(item);
                        unBlockUI();
                    },
                    error: handleError,
                    dataType: "json"
                });
            });
        })
    };
}

/**
 * View model for smg listing for user
 * @constructor
 */
function SMGListingViewModel() {
    var self = this;
    self.fields = ko.observableArray([]);
    self.loading = ko.observable(true);
    self.items = ko.observableArray([]);
    self.view = ko.observable("list");
    fakeTimeout(function () {
        async.series([
            function (cb) {
                getJSON(API_URL + "/searchForms?active=true", function (ret) {
                    var form = ret[0];
                    if (!form) {
                        alert('Active search form not found');
                        return;
                    }
                    var fields = _.map(form.fields, function (field) {
                        var ret = {
                            name: field.characteristic.name,
                            type_id: field.characteristic.type_id,
                            characteristic_id: field.characteristic_id,
                            help: field.characteristic.description,
                            values: _.chain(field.values)
                                .map(function (v) {
                                    if (!v.valueType) {
                                        return null;
                                    }
                                    return {
                                        name: v.valueType.name,
                                        valuetype_id: v.valuetype_id
                                    }
                                })
                                .compact()
                                .value(),
                            value: ko.observable(""),
                            selectedValue: ko.observable()
                        };
                        if ([chTypes.number, chTypes.text, chTypes.textarea].indexOf(ret.type_id) != -1) {
                            ret.value.extend({required: false})
                        }
                        if (ret.type_id == chTypes.number) {
                            ret.value.extend({number: false})
                        }
                        return ret;
                    });
                    self.fields(fields);
                    self.errors = ko.validation.group(fields, { deep: true });
                    cb();
                });
            }, function (cb) {
                self.search();
            }]);
    });
    self.selectedItems = ko.computed(function () {
        var items = self.items();
        return _.filter(items, function (item) {
            return item.compare();
        })
    });
    self.compareUrl = ko.computed(function () {
        var items = self.selectedItems();
        if (items.length == 2) {
            return "/compare/" + items[0].id + "/" + items[1].id;
        }
        return "javascript:;";
    });
    self.alternative = ko.computed(function () {
        return self.selectedItems().length;
    });
    self.search = function () {
        self.loading(true);
        var criteria = _.chain(self.fields()).map(function (f) {
            var val = f.selectedValue();
            if (val) {
                val = [val];
            } else {
                val = f.value().trim();
            }
            return {
                characteristic: f.characteristic_id,
                value: val
            }
        }).filter(function (f) {
            return f.value.length;
        }).value();
        var url = API_URL + "/search2?criteria=" + encodeURIComponent(JSON.stringify(criteria));
        if (!criteria.length) {
            url = API_URL + "/smgs";
        }
        fakeTimeout(function () {
            getJSON(url, function (ret) {
                var items = _.map(ret, function (item) {
                    var getChar = function (id) {
                        var foundChar = _.filter(item.smgCharacteristics, function (ch) {
                            return ch.characteristic_id == id
                        })[0];
                        if (foundChar) {
                            if (foundChar.valueType) {
                                return foundChar.valueType.name;
                            }
                            return foundChar.value;
                        }
                        return "";
                    };
                    var model = {
                        id: item.id,
                        name: getChar(chIds.name),
                        desc: getChar(chIds.desc),
                        duration: getChar(chIds.duration),
                        cost: formatCost(getChar(chIds.cost)),
                        compare: ko.observable(false),
                        org: item
                    };
                    model.compare.subscribe(function (val) {
                        if (self.popupSmg() == model) {
                            return;
                        }
                        self.popupSmg(null);
                        if (val && self.selectedItems().length == 2) {
                            showModal($("#cannot-add-compare"));
                            setTimeout(function () {
                                model.compare(false);
                            }, 0);
                        }
                    });
                    return model;
                });
                self.items(items);
                self.loading(false);
            });
        });
    };
    self.popupSmg = ko.observable();
    self.popupSmgModel = ko.observable();
    self.showPopup = function (smg) {
        self.popupSmgModel(new SMGModel(smg.org));
        self.popupSmg(smg);
        showModal($("#agreement-popup"));
    };
    self.comparePopup = function () {
        hideModal($("#agreement-popup"));
        if (!self.popupSmg().compare()) {
            console.log(self.selectedItems().length);
            if (self.selectedItems().length == 2) {
                showModal($("#cannot-add-compare"));
            } else {
                self.popupSmg().compare(true);
            }
        }
    };
    $("#body").on('click', "#right-panel #list-view .row3-wrapper ul li, #grid-view .white-box", function(event) {
		var $target = $(event.target);
		if(!$target.is("a.title")){
            self.showPopup(ko.dataFor(this))
		}
    })
}


/**
 * Map smg api data to model
 * @param {Object} data the api data
 * @constructor
 */
function SMGModel(data) {
    var self = this;
    self.values = {};
    self.characteristics = {};
    //without name
    self.otherValues = {};
    self.name = "";
    self.id = data.id;

    _.each(data.smgCharacteristics, function (prop) {
        var val = prop.value;
        if (prop.valuetype_id != null) {
            var selectedItem = _.filter(prop.characteristic.values, function (v) {
                return v.id == prop.valuetype_id
            })[0];
            if (!selectedItem) {
                val = "";
            } else {
                val = selectedItem.name;
            }
        }
        self.values[prop.characteristic.name] = val;
        self.characteristics[prop.characteristic.id] = val;
        prop.displayValue = val;
        if (prop.characteristic.id == chIds.name) {
            self.name = val;
        } else {
            self.otherValues[prop.characteristic.name] = val;
        }
    });

    self.smgCharacteristics = ko.observableArray(data.smgCharacteristics);
    self.tab1Items = ko.computed(function () {
        return _.filter(self.smgCharacteristics(), function (item) {
            return item.characteristic.tab === chTabs[0]
        })
    });
    self.tab3Items = ko.computed(function () {
        return _.filter(self.smgCharacteristics(), function (item) {
            return item.characteristic.tab === chTabs[1]
        })
    });
    self.examples = _.pluck(data.examples, "description");
}

/**
 * View model for smg compare
 * @constructor
 */
function CompareViewModel() {
    var self = this;
    self.loading = ko.observable(true);
    var ids = [urlParams.left, urlParams.right];
    self.items = ko.observableArray([]);
    fakeTimeout(function () {
        var items = [];
        async.forEachSeries(ids, function (id, cb) {
            getJSON(API_URL + "/smg/" + id, function (ret) {
                items.push(new SMGModel(ret));
                cb();
            });
        }, function () {
            self.items(items);
            self.loading(false);
        })
    })
}


/**
 * View model for smg details for admin
 * @constructor
 */
function SMGDetailsViewModel() {
    var self = this;
    var id = urlParams.id;
    self.loading = ko.observable(true);
    self.smg = ko.observable();
    fakeTimeout(function () {
        getJSON(API_URL + "/smg/" + id, function (ret) {
            self.smg(new SMGModel(ret));
            self.loading(false);
        })
    });

    self.deleteSmg = function () {
        showConfirm("Are you sure want to delete this solution?", function () {
            blockUI();
            fakeTimeout(function () {
                $.ajax({
                    type: "delete",
                    url: API_URL + "/smg/" + id,
                    contentType: 'application/json',
                    success: function () {
                        window.location = "/admin/smg";
                    },
                    error: handleError,
                    dataType: "json"
                });
            });
        });
    }
}


//view model for example list
function ExamplesViewModel() {
    var self = this;
    self.items = ko.observableArray([]);
    self.sortedItems = ko.computed(function () {
        var items = self.items();
        items.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        return _.filter(items, function (item) {
            return item.examples.length;
        });
    });
    self.loading = ko.observable(true);
    self.selectedSmg = ko.observable();
    self.examples = ko.computed(function () {
        var smg = self.selectedSmg();
        if (smg) {
            return smg.examples;
        }
        return _.chain(self.items())
            .pluck("examples")
            .flatten()
            .value();
    });
    fakeTimeout(function () {
        getJSON(API_URL + "/smgs", function (ret) {
            _.each(ret, function (smg) {
                smg.name = getSMGValue(smg, chIds.name);
                _.each(smg.examples, function (example) {
                    example.smg = smg;
                })
            });
            self.loading(false);
            self.items(ret);
        });
    });
}

//view model for example details
function ExampleDetailsViewModel() {
    var self = this;
    self.loading = ko.observable(true);
    self.smg = ko.observable();
    self.example = ko.observable();
    self.examples = ko.observableArray([]);

    fakeTimeout(function () {
        getJSON(API_URL + "/smg/" + urlParams.smg, function (ret) {
            self.smg(ret);
            _.each(self.smg().examples, function (item) {
                if (item.id == urlParams.id) {
                    self.example(item);
                } else {
                    self.examples.push(item);
                }
            });
            if (!self.example()) {
                alert('Example not found');
            } else {
                self.loading(false);
            }
        });
    })

}

//view model for Manage Help
function HelpViewModel() {
    var self = this;
    self.tab = ko.observable("dashboard");
    self.topics = ko.observableArray([]);
    self.loading = ko.observable(false);
    self.topicsLoaded = ko.observable(false);
    self.dashboardLoaded = ko.observable(false);
    self.dashboardText = ko.observable("");

    self.showDashboard = function () {
        self.tab("dashboard");
        window.location.hash = "";
        if (self.dashboardLoaded()) {
            return;
        }
        blockUI();
        fakeTimeout(function () {
            getJSON(API_URL + "/dashboard", function (ret) {
                self.dashboardText(ret.description);
                self.dashboardLoaded(true);
                unBlockUI();
            });
        });
    };
    self.revert = function () {
        window.location.reload();
    };
    self.saveDashboard = function () {
        blockUI();
        fakeTimeout(function () {
            var data = JSON.stringify({
                description: self.dashboardText()
            });
            $.ajax({
                type: "post",
                url: API_URL + "/dashboard",
                contentType: 'application/json',
                data: data,
                success: function () {
                    unBlockUI();
                },
                error: handleError,
                dataType: "json"
            });
        })
    };
    self.showTopics = function () {
        self.tab("topics");
        window.location.hash = "#topics";
        if (self.topicsLoaded()) {
            return;
        }
        self.loading(true);
        fakeTimeout(function () {
            getJSON(API_URL + "/helpTopic", function (ret) {
                self.topics(ret);
                self.topicsLoaded(true);
                self.loading(false);
            });
        });
    };

    self.deleteTopic = function (topic) {
        showConfirm("Are you sure you want to delete this topic?", function () {
            blockUI();
            fakeTimeout(function () {
                $.ajax({
                    type: "delete",
                    url: API_URL + "/helpTopic/" + topic.id,
                    contentType: 'application/json',
                    success: function () {
                        unBlockUI();
                        self.topics.remove(topic);
                    },
                    error: handleError,
                    dataType: "json"
                });
            });
        });
    };

    if (window.location.hash == "#topics") {
        self.showTopics();
    } else {
        self.showDashboard();
    }
}

//view model for adding or editing help
function AddEditHelpViewModel() {
    var self = this;
    self.name = ko.observable().extend({ required: true });
    self.imageName = ko.observable().extend({ required: true });
    self.imageId = ko.observable();
    self.description = ko.observable().extend({ required: true });
    self.id = urlParams.id;
    self.editing = !!urlParams.id;
    self.errors = ko.validation.group(self);
    self.previewName = ko.observable();
    self.previewDescription = ko.observable();
    self.previewImg = ko.observable();

    self.save = function () {
        self.errors.showAllMessages();
        if (self.errors().length) {
            return;
        }
        blockUI();

        var data = JSON.stringify({
            name: self.name(),
            description: self.description(),
            image_id: self.imageId()
        });
        fakeTimeout(function () {
            if (self.editing) {
                $.ajax({
                    type: "put",
                    url: API_URL + "/helpTopic/" + self.id,
                    contentType: 'application/json',
                    data: data,
                    success: function () {
                        unBlockUI();
                        showAlert("Help topic has been saved!", function () {
                            window.location.href = "/admin/help#topics"
                        });
                    },
                    error: handleError,
                    dataType: "json"
                });
            } else {
                $.ajax({
                    type: "post",
                    url: API_URL + "/helpTopic/",
                    contentType: 'application/json',
                    data: data,
                    success: function () {
                        unBlockUI();
                        showAlert("Help topic was added!", function () {
                            window.location.href = "/admin/help#topics"
                        });
                    },
                    error: handleError,
                    dataType: "json"
                });
            }
        })
    };

    self.preview = function () {
        self.errors.showAllMessages();
        if (self.errors().length) {
            return;
        }
        self.previewName(self.name());
        self.previewDescription(self.description());
        self.previewImg(API_URL + "/helpTopic/" + self.imageId() + "/download");
        $(".preview-panel").show();
    };
    $('#FileUpload').change(function () {
        var value = $('#FileUpload').val();
        if (!value.length) {
            return;
        }

        var $elem = $('.process');
        if (!$elem.length) {
            $elem = $('<div class="process"><div class="processbg"><div class="processbar"></div><div class="processtext"></div></div></div>');
            $('body').append($elem);
        }
        $elem.show();
        $elem.find(".processbar").width("0");

        $('#ImageForm').ajaxSubmit({
            dataType: 'json',
            success: function (ret) {
                if (ret.mime.indexOf("image") == -1) {
                    showAlert("Invalid image");
                    $('.process').hide();
                    return;
                }
                self.imageName(ret.filename);
                self.imageId(ret.id);
                $('.process').hide();
            },
            uploadProgress: function (event, position, total, percent) {
                $elem.find(".processbar").width(percent + "%");
                $elem.find(".processtext").text(Math.floor(percent)+"%");
            },
            error: function (response) {
                $('.process').hide();
                handleError(response);
            }
        });
    });

    if (self.editing) {
        blockUI();
        fakeTimeout(function () {
            getJSON(API_URL + '/helpTopic/' + self.id, function (ret) {
                unBlockUI();
                self.name(ret.name);
                self.description(ret.description);
                self.imageName(ret.image.filename);
                self.imageId(ret.image_id);
                self.preview();
            })
        })
    }
}

//view model for help topics for normal user
function UserHelpListingViewModel() {
    var self = this;
    self.loading = ko.observable(true);
    self.items = ko.observableArray([]);

    fakeTimeout(function () {
        getJSON(API_URL + "/helpTopic", function (ret) {
            self.items(ret);
            self.loading(false);
        });
    });
}

//view model for help topics details for normal user
function HelpDetailsViewModel() {
    var self = this;
    var id = Number(urlParams.id);
    self.loading = ko.observable(true);
    self.topic = ko.observable();
    self.related = ko.observableArray([]);
    self.examples = ko.observableArray([]);
    self.errors = ko.validation.group(self);
    fakeTimeout(function () {
        async.parallel([
            function (cb) {
                getJSON(API_URL + "/helpTopic", function (ret) {
                    var others = [];
                    _.each(ret, function (item) {
                        if (item.id == id) {
                            self.topic(item);
                        } else {
                            others.push(item);
                        }
                    });
                    self.related(_.sample(others, 3));
                    if (!self.topic()) {
                        alert('help topic not found');
                        return;
                    }
                    cb();
                });
            }, function (cb) {
                getJSON(API_URL + "/smgs", function (ret) {
                    var sample = _.chain(ret).pluck("examples").flatten().sample(4).value();
                    self.examples(sample);
                    cb();
                });
            }
        ], function () {
            self.loading(false);
        })
    });
}

//view model for home
function HomeViewModel() {
    var self = this;
    self.widgetHtml = ko.observable();
    self.examples = ko.observableArray([]);
    self.topics = ko.observableArray([]);
    self.fields = ko.observableArray([]);
    self.loading = ko.observable(true);
    blockUI();
    fakeTimeout(function () {
        async.parallel([
            function (cb) {
                getJSON(API_URL + "/dashboard", function (ret) {
                    self.widgetHtml(ret.description);
                    cb();
                })
            }, function (cb) {
                getJSON(API_URL + "/smgs", function (ret) {
                    var examples = _.chain(ret)
                        .pluck("examples")
                        .flatten()
                        .value();
                    self.examples(examples);
                    var carousels = $('.carousel-content');
                    if (carousels.length) {
                        $(".carousel-content").slick({
                            slidesToShow: 5,
                            slidesToScroll: 1
                        });
                    }
                    cb();
                });
            }, function (cb) {
                getJSON(API_URL + "/searchForms?active=true", function (ret) {
                    if (!ret.length) {
                        cb();
                        return;
                    }
                    var form = ret[0];
                    form.fields.sort(function (a, b) {
                        return a.sort - b.sort;
                    });
                    var fields = _.map(form.fields, function (field) {
                        var ret = {
                            name: field.characteristic.name,
                            type_id: field.characteristic.type_id,
                            characteristic_id: field.characteristic_id,
                            help: field.characteristic.description,
                            values: _.chain(field.values)
                                .map(function (v) {
                                    if (!v.valueType) {
                                        return null;
                                    }
                                    return {
                                        name: v.valueType.name,
                                        valuetype_id: v.valuetype_id
                                    }
                                })
                                .compact()
                                .value(),
                            value: ko.observable(),
                            selectedValue: ko.observable()
                        };
                        if ([chTypes.number, chTypes.text, chTypes.textarea].indexOf(ret.type_id) != -1) {
                            ret.value.extend({required: false})
                        }
                        if (ret.type_id == chTypes.number) {
                            ret.value.extend({number: false})
                        }
                        return ret;
                    });
                    self.fields(fields);
                    self.errors = ko.validation.group(fields, { deep: true });
                    cb();
                });
            }, function (cb) {
                getJSON(API_URL + "/helpTopic", function (ret) {
                    self.topics(_.sample(ret, 3));
                    cb();
                })
            }
        ], function () {
            self.loading(false);
            unBlockUI();
        })
    });

    self.search = function () {
        self.errors.showAllMessages();
        window.location = "/smg";
    }
}


$(function () {

    window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObject) {
        if (errorObject && /<omitted>/.test(errorMsg) && console) {
            console.error('Full exception message: ' + errorObject.message);
        }
    };

    $(document).click(function (e) {
        if ($(e.target).closest('.jqTransformSelectWrapper').length) {
            $('.jqTransformSelectWrapper').css('zIndex', 99);
            $(e.target).closest('.jqTransformSelectWrapper').css('zIndex', 100);
            return;
        }
        $('.jqTransformSelectWrapper ul').hide();
    });


    $(document).on('blur', '.js-leading-zeros', function () {
        if ($(this).hasClass('is-error')) {
            return;
        }
        var val = $(this).val();
        if (/^0+$/.test(val)) {
            val = "0";
        } else {
            val =  val.replace(/^0+/, '');
        }
        $(this).val(val);
    });

    $('#header .logout').click(function () {
        showAlert('Please close your browser');
    });
    if ($('.js-manage-characteristics').length) {
        ko.applyBindings(new ManageCharacteristicsViewModel());
    }
    if ($('.js-add-edit-smg').length) {
        ko.applyBindingsWithValidation(new AddEditSMGViewModel());
    }
    if ($('.js-admin-smg').length) {
        ko.applyBindings(new AdminSMGViewModel());
    }
    if ($('.js-admin-filter').length) {
        ko.applyBindings(new FormFilterViewModel());
    }
    if ($('.js-admin-filter-listing').length) {
        ko.applyBindings(new FormFilterListingViewModel());
    }
    if ($('.js-smg-listing').length) {
        ko.applyBindings(new SMGListingViewModel());
    }
    if ($('.js-smg-compare').length) {
        ko.applyBindings(new CompareViewModel());
    }
    if ($('.js-smg-details').length) {
        ko.applyBindings(new SMGDetailsViewModel());
    }

    if ($('.js-example-listing').length) {
        ko.applyBindings(new ExamplesViewModel());
    }
    if ($('.js-example-details').length) {
        ko.applyBindings(new ExampleDetailsViewModel());
    }
    if ($('.js-add-edit-help').length) {
        ko.applyBindingsWithValidation(new AddEditHelpViewModel());
    }
    if ($('.js-manage-help').length) {
        ko.applyBindingsWithValidation(new HelpViewModel());
    }
    if ($('.js-help-listing').length) {
        ko.applyBindings(new UserHelpListingViewModel());
    }
    if ($('.js-help-details').length) {
        ko.applyBindings(new HelpDetailsViewModel());
    }
    if ($('.js-home').length) {
        ko.applyBindingsWithValidation(new HomeViewModel());
    }
});