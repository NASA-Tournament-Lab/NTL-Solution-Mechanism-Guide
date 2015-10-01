/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */


//handler for showing error tooltip
ko.bindingHandlers.errorTooltip = {

    init: function(element, valueAccessor) {
        var obsv = valueAccessor();

        var val = ko.utils.unwrapObservable(obsv);

        if($("body").find("#error-popup").length ===0){
            var tmp = [];
            tmp.push('<div id="error-popup">');
            tmp.push('<div class="error-content">');
            tmp.push('<span class="error-arrow"></span>');
            tmp.push('<div class="msg"></div>');
            tmp.push('</div></div>');
            $("body").append(tmp.join(""));
        }
        $(element).on("mouseover", function () {
            $("#error-popup").show();
            var pos = $(this).offset();
            $("#error-popup .msg").html("<p>" + $(element).data('error') + "</p>");
            $("#error-popup").css({
                left:pos.left+7,
                top:pos.top+20
            })
        });
        $(element).on("mouseout", function () {
            $("#error-popup").hide();
        });
    },
    update: function(element, valueAccessor) {
        var obsv = valueAccessor(),
            config = ko.validation.utils.getConfigOptions(element),
            val = ko.utils.unwrapObservable(obsv),
            isModified,
            isValid;

        if (!obsv.isValid || !obsv.isModified) {
            throw new Error("Observable is not validatable");
        }
        $(element).data('error', obsv.error());
        isModified = obsv.isModified();
        isValid = obsv.isValid();
        var isVisible = !config.messagesOnModified || isModified ? !isValid : false;
        if (!isVisible) {
            $(element).hide();
        } else {
            $(element).show();
        }

    }
};

//handler for showing error tooltip
ko.bindingHandlers.errorPopup = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        $(element).on("mouseover", function () {
            $("#error-popup").show();
            var pos = $(this).offset();
            $("#error-popup .msg").html("<p>" + valueAccessor().error() + "</p>");
            $("#error-popup").css({
                left:pos.left+7,
                top:pos.top+20
            })
        });
        $(element).on("mouseout", function () {
            $("#error-popup").hide();
        });
    }
};


//dotdotdot plugin, used to fit text to div
ko.bindingHandlers.truncate = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var options = allBindingsAccessor().truncateOptions || {};
        if (options.extractText) {
            value = $('<div></div>').html(value).text();
        }
        $(element).text(value);
        $(element).dotdotdot(options);
    }
};

//iCheck plugin
ko.bindingHandlers.iCheck = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var observable = valueAccessor();
        var trueFalseString = false;
        var value = ko.utils.unwrapObservable(observable);
        if (allBindingsAccessor().iCheckOptions) {
            trueFalseString = allBindingsAccessor().iCheckOptions.trueFalseString;
        }
        if (trueFalseString) {
            if (value == "True") {
                this.checked = true;
            } else {
                observable("False");
                this.checked = false;
            }
        }
        $(element).iCheck();
        $(element).on('ifChanged', function () {
            if (trueFalseString) {
                observable(this.checked ? "True" : "False");
            } else {
                if (allBindingsAccessor().value) {
                    value = ko.utils.unwrapObservable(allBindingsAccessor().value);
                } else {
                    value = $(element).val();
                }
                if (observable.push) {
                    if (this.checked) {
                        if (observable.indexOf(value) === -1) {
                            observable.push(value);
                        }
                    } else {
                        observable.remove(value);
                    }
                } else {
                    if ($(element).is("input[type='radio']") && !this.checked) {
                        return;
                    }
                    observable(this.checked ? value : null);
                }
            }
        });
        },
    update: function (element, valueAccessor, allBindingsAccessor) {
        var observable = valueAccessor();
        var trueFalseString = false;
        var value = ko.utils.unwrapObservable(observable);
        if (allBindingsAccessor().iCheckOptions) {
            trueFalseString = allBindingsAccessor().iCheckOptions.trueFalseString;
        }
        if (trueFalseString) {
            if (value == "True") {
                this.checked = true;
                $(element).iCheck('check');
            } else {
                this.checked = false;
                $(element).iCheck('uncheck');
            }
        } else {
            var radioValue, isChecked;
            if (allBindingsAccessor().value) {
                radioValue = ko.utils.unwrapObservable(allBindingsAccessor().value);
            } else {
                radioValue = $(element).val();
            }
            if (observable.push) {
                isChecked = observable.indexOf(radioValue) !== -1;
            } else {
                isChecked = (value == radioValue) || (value && radioValue == 'on');
            }
            if (isChecked) {
                this.checked = true;
                $(element).iCheck('check');
            } else {
                this.checked = false;
                $(element).iCheck('uncheck');
            }
        }
    }
};

//Watch specified variable and apply errorClass if there is a validation error
ko.bindingHandlers.hasError = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var observable = valueAccessor();
        var check = function () {
            var $target = $(element);
            if (allBindingsAccessor().hasErrorTarget) {
                $target = $(element).closest(allBindingsAccessor().hasErrorTarget);
            }
            if (!observable.isValid() && observable.isModified()) {
                $target.addClass('is-error');
            } else {
                $target.removeClass('is-error');
            }
        };
        observable.isValid.subscribe(check);
        observable.isModified.subscribe(check);
    }
};

//jqTransform plugin (custom select)
ko.bindingHandlers.jqTransform = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        setTimeout(function () {
            $(element).jqTransform();
        }, 150);
    },
    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor()();
        setTimeout(function () {
            var index = $(element).prop("selectedIndex");
            if (index == -1) {
                return;
            }
            var ele = $(element).closest('.jqTransformSelectWrapper').find('li > a').eq(index);
            ele.click();
        }, 50);
    }
};

//Ckeditor plugin (rich editor)
ko.bindingHandlers.ckEditor = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).html(value);
        $(element).ckeditor(allBindingsAccessor().ckEditorOptions || {});
        var editor = $(element).ckeditorGet();
        var update = function (e) {
            setTimeout(function () {
                valueAccessor()($(e.listenerData).val());
            }, 100);
        };
        editor.on('key', update, this, element);
        editor.on('change', update, this, element);
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var editor = $(element).ckeditorGet();
        if (editor.getData() != value) {
            //double setData because there is a weird bug in edit smg
            editor.setData(value);
            setTimeout(function () {
                editor.setData(value);
            }, 100);
        }
    }
};


//jqSelect plugin (custom select)
ko.bindingHandlers.jqSelect = {
    init: function(element, valueAccessor, allBindings) {
        setTimeout(function () {
            $(element).jqTransSelect();
        }, 0);
        if (allBindings().options && allBindings().options.subscribe) {
            allBindings().options.subscribe(function () {
                var i= $(element).parent().find('div,ul').remove().css('zIndex');
                $(element).unwrap().removeClass('jqTransformHidden').jqTransSelect();
                $(element).parent().css('zIndex', i);
            });
        }

        var index = $(element).prop("selectedIndex");
        if (index == 0 && allBindings().optionsCaption) {
            $(element).closest('.jqTransformSelectWrapper').find('span').addClass('jqTransformPlaceholder');
        } else {
            $(element).closest('.jqTransformSelectWrapper').find('span').addClass('jqTransformPlaceholder');
        }
    },
    update: function(element, valueAccessor, allBindings) {
        var value = allBindings().value();
        setTimeout(function () {
            var index = $(element).prop("selectedIndex");
            if (index == -1) {
                return;
            }
            var ele = $(element).closest('.jqTransformSelectWrapper').find('li > a').eq(index);
            ele.click();
            if (index == 0 && allBindings().optionsCaption) {
                $(element).closest('.jqTransformSelectWrapper').find('span').addClass('jqTransformPlaceholder');
            } else {
                $(element).closest('.jqTransformSelectWrapper').find('span').removeClass('jqTransformPlaceholder');
            }
        }, 50);
    }
};



//ajax loader animation
ko.bindingHandlers.loader = {
    init: function(element, valueAccessor, allBindings) {
        var value = ko.unwrap(valueAccessor());
        if (value) {
            var $ele = $(element);
            $ele.show();
            animateObject($ele, allBindings().loaderHeight || 36);
        }

    },
    update: function(element, valueAccessor, allBindings) {
        var value = ko.unwrap(valueAccessor());
        var $ele = $(element);
        if (value) {
            $ele.show();
            animateObject($ele, allBindings().loaderHeight || 36);
        } else {
            $ele.hide();
            var timer = $ele.data('timer');
            if (timer) {
                clearInterval(timer);
                $ele.data('timer', null);
            }
        }
    }
};


//copy to clipboard plugin
ko.bindingHandlers.zclip = {
    init: function(element, valueAccessor, allBindings) {
        $(element).zclip({
            path: '/js/libs/zclip/ZeroClipboard.swf',
            copy: function() {
                var val = ko.unwrap(valueAccessor());
                if (!val) {
                    return "";
                }
                return getPictureUrl(val);
            }
        });
    }
};

//file upload
ko.bindingHandlers.fileUpload = {
    init: function(element, valueAccessor, allBindings) {
        var $root = $(allBindings().fileUploadRoot);
        var multiple = allBindings().fileUploadMultiple;
        var fileModel;
        var uploads;
        if (multiple) {
            uploads = valueAccessor();
        } else {
            fileModel = ko.unwrap(valueAccessor());
        }
        //browse file
        $root.on("click", ".js-action-browse", function(){
            $root.find(":file").trigger("click");
        });

        //get browse file name
        $root.find(":file").change(function() {
            var that = $(this);
           // var _this = this;
            var value = that.val();
            if (!value) {
                return;
            }
            var fileName = getFileName(value);
            if (allBindings().fileName) {
                $(allBindings().fileName).val(fileName);
            }
            if (multiple) {
                fileModel = {
                    filename: ko.observable(""),
                    fileId: ko.observable(""),
                    uploading: ko.observable(false),
                    progress: ko.observable(0),
                    uploaded: ko.observable(true),
                    remove: function () {
                        uploads.remove(fileModel);
                    }
                };
                fileModel.fileUrl = ko.computed(function () {
                    if (!fileModel.fileId()) {
                        return null;
                    }
                    return getPictureUrl(fileModel.fileId());
                });
                uploads.push(fileModel);
            }

            fileModel.uploading(true);
            $root.find('form').ajaxSubmit({
                dataType: 'json',
                success: function (ret) {
                    if (ret.mime.indexOf("image") == -1) {
                        showAlert("Invalid image");
                        fileModel.uploading(false);
                        if (multiple) {
                            uploads.remove(fileModel);
                        }
                        return;
                    }
                    fileModel.filename(ret.filename);
                    fileModel.fileId(ret.id);
                    fileModel.uploading(false);
                    fileModel.uploaded(true);
                },
                uploadProgress: function (event, position, total, percent) {
                    fileModel.progress(Math.floor(percent));
                },
                error: function (response) {
                    if (multiple) {
                        uploads.remove(fileModel);
                    }
                    fileModel.uploading(false);
                    handleError(response);
                }
            });

        });

    },
    update: function(element, valueAccessor) {
    }
};


//align box height in smg listing
ko.bindingHandlers.alignBox = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var ele = $(element);
        if (ele.hasClass("left")) {
            return;
        }
        setTimeout(function () {
            var left = ele.prev();
            var height = Math.max(left.find('.title').height(), ele.find('.title').height());
            left.find('.title').height(height)
            ele.find('.title').height(height)
        });
    }
};


ko.bindingHandlers.dollarSign = {
    init: function (element, valueAccessor) {
    },
    update: function(element, valueAccessor) {
        var smg = valueAccessor();
        var values = _.where(smg.smgCharacteristics, {characteristic_id: 6});
        var mapping = window.dashboard.dollarMapping || {};
        $(element).removeClass("dollar1 dollar2 dollar3");
        var max = 1;
        var title = "";
        _.each(values, function (value) {
            var sign = mapping[value.valueType.id];
            if (sign) {
                var dollarValue = sign.length;
                if (dollarValue >= max) {
                    max = dollarValue;
                    title = value.valueType.name;
                }
            }
        });
        $(element).addClass("dollar" + max);
        $(element).attr('title', title);
    }
};


ko.bindingHandlers.clockText = {
    update: function (element, valueAccessor) {
        var smg = valueAccessor();
        var values = _.where(smg.smgCharacteristics, {characteristic_id: 5});
        var text = "Low";
        var max = 1;
        var title = "";
        var mapping = window.dashboard.timeMapping || {};
        _.each(values, function (value) {
            var time = mapping[value.valueType.id];
            if (time) {
                var timeValue = 1;
                if (time === "Med") {
                    timeValue = 2;
                }
                if (time === "High") {
                    timeValue = 3;
                }
                if (timeValue >= max) {
                    text = time;
                    max = timeValue;
                    title = value.valueType.name;
                }
            }
        });
        $(element).attr('title', title);
        $(element).next().text(text);
    }
};


ko.bindingHandlers.radial = {
    update: function (element, valueAccessor) {
        var smg = valueAccessor();

        $(element).removeClass("gray-radial brown-radial yellow-radial blue-radial green-radial");
        $(element).attr('title', smg.radialTitle);
        $(element).addClass(smg.radialClass);
    }
};