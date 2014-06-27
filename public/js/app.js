/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */

CKEDITOR.config.allowedContent = true; 
CKEDITOR.config.protectedSource.push(/<[^>]*><\/[^>]*>/g);
 
/**
 * Base API URL
 */
var API_URL = "/api";

/**
 * Template Zip file URL
 */
var TEMPLATE_URL="/sample.zip"

/**
 * Characteristic types, number represent ID
 */
var chTypes = {
    checkbox: 1,
    number: 2,
    picklist: 3,
    radio: 4,
    text: 5,
    textarea: 6,
    image: 7
};

var exampleTypes = ["type1", "type2", "type3", "type4"];

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
    image: 4,
    duration: 5,
    cost: 6
};

if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

if (!Array.prototype.indexOf) {
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
 * Get picture url for smg
 * @param {String} fileId the file upload id
 * @returns {string} the url
 */
function getPictureUrl(fileId) {
    return API_URL + "/helpTopic/" + fileId + "/download";
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
function showAlert(text, onClose, isHtml) {
    var $popup = $('#alert-popup').clone();
    if (isHtml) {
        $popup.find('.popup-form span').html(text);
    } else {
        $popup.find('.popup-form span').text(text);
    }
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
                    self.types(_.filter(ret, function (type) { return type.id !== chTypes.image}));
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
            blockDelete: ko.observable(false),
            typeName: ko.observable(""),
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
        self.newCharacteristic().blockDelete(item.blockDelete || false);
        self.newCharacteristic().tab(item.tab);
        self.newCharacteristic().description(item.description);
        self.newCharacteristic().type(item.type_id);
        self.newCharacteristic().typeName(item.type.name);
        self.newCharacteristic().values(_.map(item.values, function (ele) {
            return { val: ele.name, id: ele.id};
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
            .filter(function (ele) {
                return ele.val.trim().length;
            })
            .value();
        if ([chTypes.picklist, chTypes.radio, chTypes.checkbox].indexOf(newChar.type()) !== -1) {
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
                return {name: ele.val, id: ele.id}
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
                async.waterfall([
                    function (cb) {
                        $.ajax({
                            type: "put",
                            url: API_URL + "/characteristic/" + item.id + "/check",
                            contentType: 'application/json',
                            data: data,
                            success: function (ret) { cb(null, ret); },
                            error: onError,
                            dataType: "json"
                        });
                    }, function (ret, cb) {
                        if (!ret.affect) {
                            cb();
                            return;
                        }
                        $('#add-popup').hide();
                        showConfirm("Value(s): " + ret.values.join(', ') +  " are currently being used by some SMGs," +
                            " removing these value will set the SMG association to the first lookup item." +
                            " Are you sure you want to proceed?",
                            cb,
                            function () {
                                self.submitting(false);
                                clearAnimation($('#add-popup .js-add-loader'));
                                showModal($('#add-popup'));
                            });
                    }, function (cb) {
                        $('#add-popup').show();
                        $("#modal-window-bg").show();
                        fakeTimeout(function () {
                            $.ajax({
                                type: "put",
                                url: API_URL + "/characteristic/" + item.id,
                                contentType: 'application/json',
                                data: data,
                                success: function (ret) { cb(null, ret); },
                                error: onError,
                                dataType: "json"
                            });
                        });
                    }, function (ret) {
                        self.allItems.remove(item);
                        self.allItems.push(ret);
                        self.closeAddPopup();
                        showAlert('Characteristic Has Been Saved');
                    }
                ]);
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
        if (item.blockDelete) {
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
    self.examples = ko.observableArray([]);
    self.activeExample = ko.observable();

    self.step1Items = ko.computed(function () {
        return _.filter(self.characteristics(), function (item) {
            return item.tab === chTabs[0];
        })
    });
    self.step3Items = ko.computed(function () {
        return _.filter(self.characteristics(), function (item) {
            return item.tab === chTabs[1];
        })
    });
    self.picture = ko.computed(function () {
        var item = _.filter(self.characteristics(), function (item) {
            return item.id == chIds.image;
        })[0];
        if (item) {
            return getPictureUrl(item.file.fileId());
        }
        return null;
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

                        if (item.type_id == chTypes.checkbox) {
                            item.multipleValue = ko.observableArray([]).extend(extend);
                        } else {
                            item.value = ko.observable().extend(extend);
                        }
                        item.displayValue = ko.computed(function () {
                            if (item.multipleValue) {
                                var values = _.pluck(item.multipleValue(), "name");
                                values.sort();
                                return values.join(", ");
                            }
                            var val = item.value();
                            if (val && val.name) {
                                return val.name
                            }
                            return val;
                        });
                        if (item.type_id == chTypes.image) {
                            item.file = {
                                progress: ko.observable(0),
                                filename: ko.observable("").extend(extend),
                                fileId: ko.observable(""),
                                uploading: ko.observable(false),
                                uploaded: ko.observable(false)
                            };
                            item.file.fileUrl = ko.computed(function () {
                                if (!item.file.fileId()) {
                                    return "";
                                }
                                return getPictureUrl(item.file.fileId());
                            });
                            item.file.fileId.subscribe(function (val) {
                                item.value(String(val));
                            });
                            item.file.remove = function () {
                                item.file.progress(0);
                                item.file.filename("");
                                item.file.fileId("");
                                item.file.uploading(false);
                                item.file.uploaded(false);
                            }
                        }
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
                            if (ch.type_id == chTypes.picklist || ch.type_id == chTypes.radio || ch.type_id == chTypes.checkbox) {
                                val = _.filter(ch.values, function (v) {
                                    return v.id == currentCh.valuetype_id
                                })[0];
                            } else {
                                val = currentCh.value;
                            }
                            if (ch.type_id == chTypes.checkbox) {
                                ch.multipleValue.push(val);
                            } else {
                                ch.value(val);
                            }
                            if (ch.type_id == chTypes.image) {
                                ch.file.progress(100);
                                ch.file.filename(getPictureUrl(val));
                                ch.file.fileId(val);
                                ch.file.uploaded(true);
                            }
                        });
                    });
                    self.examples(_.map(ret.examples, function (item) {
                        return {
                            description: ko.observable(item.description).extend({required: true}),
                            type: ko.observable(item.type).extend({required: true}),
                            name: ko.observable(item.name).extend({required: true})
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
            window.errors = self.errorsTab1();
            self.errorsTab1.showAllMessages();
            if (self.errorsTab1().length) {
                return;
            }
        }
        if (step == 2) {
            self.errorsExamples = ko.validation.group({examples: self.examples}, { deep: true });
            self.errorsExamples.showAllMessages();
            if (self.errorsExamples().length) {
                return;
            }
            self.activeExample(self.examples()[0]);
        }
        if (step == 3) {
            self.errorsTab3.showAllMessages();
            if (self.errorsTab3().length) {
                return;
            }
        }
        self.step(self.step() + 1);
    };
    self.prevStep = function () {
        self.step(self.step() - 1);
    };

    self.addExample = function () {
        self.examples.push({
            description: ko.observable().extend({required: true}),
            name: ko.observable().extend({required: true}),
            type: ko.observable().extend({required: true})
        });
    };
    self.addExample();
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
                if (item.type_id == chTypes.checkbox) {
                    return {
                        characteristic: item.id,
                        value: _.pluck(item.multipleValue(), "id")
                    };
                }
                var val = item.value();
                if (item.type_id == chTypes.picklist || item.type_id == chTypes.radio) {
                    val = [val.id];
                }
                return {
                    characteristic: item.id,
                    value: val
                };
            }),
            examples: ko.toJS(self.examples())
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
                            aka: getChar(chIds.aka),
                            picture: getPictureUrl(getChar(chIds.image))
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
                        self.characteristics(_.filter(ret, function (item) { return item.type_id != chTypes.image; }));
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
        if ([chTypes.radio, chTypes.picklist, chTypes.checkbox].indexOf(self.newField.characteristic().type_id) != -1) {
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
                    var values = window.location.hash.substr(1).split("$");
                    var fields = _.map(form.fields, function (field) {
                        var value = values.shift();
                        var selectedValues;

                        if (field.characteristic.type_id == chTypes.picklist) {
                            value = Number(value) || undefined;
                        }
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
                            value: ko.observable(value),
                            selectedValue: ko.observable(),
                            revert: function () {
                                ret.value(value);
                                if (ret.selectedValues) {
                                    selectedValues = _.map(value.split(';'), function (v) {
                                        return Number(v);
                                    });
                                    console.log(selectedValues);
                                    ret.selectedValues(selectedValues);
                                }
                            }
                        };
                        if ([chTypes.number, chTypes.text, chTypes.textarea].indexOf(ret.type_id) != -1) {
                            ret.value.extend({required: false})
                        }
                        if (ret.type_id == chTypes.number) {
                            ret.value.extend({number: false})
                        }
                        if (ret.type_id == chTypes.radio || ret.type_id == chTypes.checkbox) {
                            ret.selectedValues = ko.observableArray();
                            if (value && value.length) {
                                selectedValues = _.map(value.split(';'), function (v) {
                                    return Number(v);
                                });
                                ret.selectedValues(selectedValues);
                                selectedValues = _.clone(selectedValues);
                            }
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
            var val = f.value();
            if (f.selectedValues) {
                val = f.selectedValues();
            } else if (_.isNumber(val)) {
                val = [val];
            } else {
                val = (val || "").trim();
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
                        picture:  getPictureUrl(getChar(chIds.image)),
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
    self.picture = "";
    self.id = data.id;
    data.smgCharacteristics = _.chain(data.smgCharacteristics)
        .groupBy(function (item) {
            return item.characteristic.id;
        })
        .map(function (group) {
            var val;
            var prop = group[0];
            val = _.map(group, function (item) {
                if (item.valueType) {
                    return item.valueType.name
                }
                return item.value || "";
            }).join(", ");
            self.values[prop.characteristic.name] = val;
            self.characteristics[prop.characteristic.id] = val;
            prop.displayValue = val;
            if (prop.characteristic.id == chIds.name) {
                self.name = val;
            } else if (prop.characteristic.id == chIds.image) {
                self.picture = getPictureUrl(val);
            } else {
                self.otherValues[prop.characteristic.name] = val;
            }
            return prop;
        })
        .value();
    self.smgCharacteristics = ko.observableArray(data.smgCharacteristics);
    self.tab1Items = ko.computed(function () {
        return _.filter(self.smgCharacteristics(), function (item) {
            return item.characteristic.tab === chTabs[0] && item.characteristic.id != chIds.image;
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
    self.activeExample = ko.observable();
    self.examples = ko.observableArray();
    fakeTimeout(function () {
        getJSON(API_URL + "/smg/" + id, function (ret) {
            self.smg(new SMGModel(ret));
            self.examples(ret.examples);
            self.activeExample(ret.examples[0]);
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
    self.dashboardCss = ko.observable("");
	self.characteristics ={};
    self.characteristicsLoaded = ko.observable(false);
    self.preview = function () {
        if (!$('#preview-css').length) {
            $('head').append("<style type='text/css' id='preview-css'></style>")
        }
        $('#preview-css').html(self.dashboardCss());
        $('#banner-preview').html(self.dashboardText());
    };
    self.images = ko.observableArray([]);
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
                self.dashboardCss(ret.css);
                self.images(_.map(ret.images || [], function (id) {
                    var fileModel = {
                        filename: ko.observable(""),
                        fileId: ko.observable(id),
                        uploading: ko.observable(false),
                        progress: ko.observable(100),
                        uploaded: ko.observable(true),
                        remove: function () {
                            self.images.remove(fileModel);
                        }
                    };
                    fileModel.fileUrl = ko.computed(function () {
                        if (!fileModel.fileId()) {
                            return null;
                        }
                        return getPictureUrl(fileModel.fileId());
                    });
                    return fileModel;
                }));
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
            window.dashboard = _.extend(window.dashboard, {
                description: self.dashboardText(),
                css: self.dashboardCss(),
                images: _.map(ko.toJS(self.images), function (image) {
                    return image.fileId;
                })
            });
            var data = JSON.stringify(window.dashboard);
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
    self.showConfiguration = function () {
        self.tab("configuration");
        window.location.hash = "#configuration";
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
    self.configuration = {
        logoutText: ko.observable(window.dashboard.logoutText || ""),
        feedbackURL: ko.observable(window.dashboard.feedbackURL || ""),
        contactUsURL: ko.observable(window.dashboard.contactUsURL || ""),
        faqURL: ko.observable(window.dashboard.faqURL || "")
    };
    self.saveConfiguration = function () {
        window.dashboard.logoutText = self.configuration.logoutText();
        window.dashboard.feedbackURL = self.configuration.feedbackURL();
        window.dashboard.contactUsURL = self.configuration.contactUsURL();
        window.dashboard.faqURL = self.configuration.faqURL();
        blockUI();
        var data = JSON.stringify(window.dashboard);
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

    }
	 self.updateAvailableFields = function(){
        var availableNames =[];
        var multiValueTypes=["picklist","radio"];
        for(var i=0;i<self.characteristics.ids.length;i++){
            var id = self.characteristics.ids[i];
            var matchCharacteristics = self.characteristics.values[id];
            var ids = _.map($("#option-field-mapping").val(),function(str){return Number(str);});
            if(ids.indexOf(id)==-1){
                if(multiValueTypes.indexOf(matchCharacteristics.type.name)==-1){
                    availableNames.push(matchCharacteristics.name);
                }else{
                    var values =[];
                    for(var j=0;j<matchCharacteristics.values.length;j++){
                        values.push('{ "id":'+matchCharacteristics.values[j].id+',"value":"'+matchCharacteristics.values[j].value+'"}')
                    }
                    availableNames.push(matchCharacteristics.name+"("+values.join(",")+")");
                }
                matchCharacteristics.selected =true;
            }
        }
        if(availableNames.length>0){
            $(".available-row div.file-field").html(availableNames.join(","));
        }else{
            $(".available-row div.file-field").html("");
        }
    }

    self.showExportSMG = function () {
        self.tab("export-smg");
        window.location.hash = "#export-smg";
        if (self.characteristicsLoaded()) {
            return;
        }
        blockUI();
        //add more file
        $(".browse-list").on("click", ".js-action-add-file", function(){
            var browseList = $(this).closest(".browse-list");
            var html = [];
            html.push('<div class="field-container clearfix">');
            html.push('<div class="file-field left">');
            html.push('<input type="text"><input type="file" name="smg">');
            html.push('</div>');
            html.push('<a href="javascript:" class="orange-big-btn align left js-action-browse">');
            html.push('<span class="orange-big-left left"></span>');
            html.push('<span class="orange-big-middle left orange-shadow">Browse</span>');
            html.push('<span class="orange-big-right left"></span>');
            html.push('</a>');
            html.push('<a href="javascript:" class="orange-big-btn align left btn-delete-file js-action-delete-file hidden">');
            html.push('<span class="orange-big-left left"></span>');
            html.push('<span class="orange-big-middle left orange-shadow"><span class="delete-icon left"></span>Delete</span>');
            html.push('<span class="orange-big-right left"></span>');
            html.push('</a>');
            html.push('<a href="javascript:" class="orange-big-btn align left btn-add-more-file js-action-add-file">');
            html.push('<span class="orange-big-left left"></span>');
            html.push('<span class="orange-big-middle left orange-shadow">Add more Files</span>');
            html.push('<span class="orange-big-right left"></span>');
            html.push('</a>');
            html.push('</div>	');
            var $elem = $(html.join(""));
            browseList.append($elem);
            browseList.find(".field-container .btn-delete-file").removeClass("hidden");
            browseList.find(".field-container .btn-add-more-file").addClass("hidden");
            browseList.find(".field-container:last  .btn-delete-file").addClass("hidden");
            browseList.find(".field-container:last  .btn-add-more-file").removeClass("hidden");
            $elem.find(":file").css("opacity", "0.001");
        });
        $(".browse-list").on("click", ".js-action-browse", function(){
            $(this).closest(".field-container").find(":file").trigger("click");
        });
        $(".browse-list").on("change", "input:file", function(){
            var that = $(this);
            var value = that.val();
            var fileName = getFileName(value);
            that.closest(".field-container").find(".file-field :text").val(fileName);
        });
        //remove browse file
        $(".browse-list").on("click", ".js-action-delete-file", function(){
            var browseRow = $(this).closest(".field-container");
            browseRow.remove();
        });
        self.loading(true);
        fakeTimeout(function () {
            getJSON(API_URL + "/characteristics", function (ret) {
                var characteristicsObj ={};
                var ids=[];
                $("#option-field-mapping option").remove();
                for(var i=0;i<ret.length;i++){
                    ids.push(ret[i].id);
                    characteristicsObj[ret[i].id] = ret[i];
                    $("#option-field-mapping").append($('<option value="'+ret[i].id+'">'+ret[i].name+'</option>'));
                }
                self.characteristics ={
                    ids:ids,
                    values:characteristicsObj
                };
                $("#option-field-mapping").select2();
                self.updateAvailableFields();
                self.characteristicsLoaded(true);
                self.loading(false);
                unBlockUI();
            });
        });
    };
    self.getTemplate = function(){
        window.open(TEMPLATE_URL);
    };
    self.getFieldIds= function(){
        var ids=[];
        var idArray = $("#option-field-mapping").select2('data');
        for(var i=0;i<idArray.length;i++){
            ids.push(idArray[i].element[0].value);
        }
        return ids;
    }
    self.exportSMG = function(){
        var ids = self.getFieldIds();
        if(!ids || ids.length==0){
            showAlert('Please select at least one field!');
            return;
        }
        var form = $("<form/>").prop({
            action: API_URL + "/exportSMGs",
            method: "POST"
        });
        $("body").append(form);
        for (var i = 0; i < ids.length; i = i + 1) {
            $("<input type='hidden'>").attr({
                name: "ids[" + i + "]",
                value: ids[i]
            }).appendTo(form);
        }
        form.submit();
    };

    self.importSMG = function(){
        var ids = self.getFieldIds();
        if(!ids || ids.length==0){
            showAlert('Please select at least one field!');
            return;
        }
        var valid = true;
        var fileNameExpression= /(.+).csv/i;
        var names =[];
        $('#export-smg input:file').each(function(){
            var filename= $(this).val();
            if(names.indexOf(filename)==-1){
                names.push(filename);
            }
            if(!fileNameExpression.test(filename.substring( filename.lastIndexOf('\\')+1))){
                valid= false;
                return false;
            }
        });
        if(!valid){
            showAlert("Please provide valid csv file!");
            return;
        }
        if(names.length!=$('#export-smg input:file').length){
            showAlert("Please not upload same name csv file more than once!");
            return;
        }
        var form  = $('#importSMGForm');
        form.find("input:hidden").remove();
        for (var i = 0; i < ids.length; i = i + 1) {
            $("<input type='hidden'>").attr({
                name: "ids[" + i + "]",
                value: ids[i]
            }).appendTo(form);
        }
        var $elem = $('.process');
        if (!$elem.length) {
            $elem = $('<div class="process"><div class="processbg"><div class="processbar"></div><div class="processtext"></div></div></div>');
            $('body').append($elem);
        }
        $elem.show();
        $elem.find(".processbar").width("0");

        form.ajaxSubmit({
            dataType: 'json',
            success: function (ret) {
                $('.process').hide();
                alert(ret);
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
    };
    if (window.location.hash == "#configuration") {
        self.showConfiguration();
    }else if (window.location.hash == "#export-smg") {
        self.showExportSMG();
    }else if (window.location.hash == "#topics") {
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
    $(".field-container").on("click", ".js-action-browse", function(){
        $(this).closest(".field-container").find(":file").focus().trigger("click");
    });
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
                    $('<style type="text/css"></style>').html(ret.css).appendTo($('head'));
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
                            id: field.id,
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
                            selectedValue: ko.observable(),
                            revert: function () {
                                ret.value('');
                                if (ret.selectedValues) {
                                    ret.selectedValues([]);
                                }
                            }
                        };
                        if ([chTypes.number, chTypes.text, chTypes.textarea].indexOf(ret.type_id) != -1) {
                            ret.value.extend({required: false})
                        }
                        if (ret.type_id == chTypes.number) {
                            ret.value.extend({number: false})
                        }
                        if (ret.type_id == chTypes.radio || ret.type_id == chTypes.checkbox) {
                            ret.selectedValues = ko.observableArray();
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
//        self.errors.showAllMessages();
//        if (self.errors().length) {
//            return;
//        }
        var hash = _.map(self.fields(), function (field) {
            if (field.selectedValues) {
                return field.selectedValues().join(";");
            }
            return field.value() || "";
        }).join("$");
        window.location = "/smg#" + hash;
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
    if (document.referrer.indexOf(window.location.host) !== -1) {
        $('.js-history-back').attr('href', document.referrer);
    }

    $('#header .logout').click(function () {
        showAlert(window.dashboard.logoutText, null, true);
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