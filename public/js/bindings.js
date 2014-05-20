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
            console.log($(element).data('error'));
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
        editor.on('key', function (e) {
            setTimeout(function () {
                valueAccessor()($(e.listenerData).val());
            }, 0);
        }, this, element);
    },
    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var editor = $(element).ckeditorGet();
        if (editor.getData() != value) {
            editor.setData(value);
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
        }, 50);
    }
};



//ajax loader animation
ko.bindingHandlers.loader = {
    init: function(element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        if (value) {
            var $ele = $(element);
            $ele.show();
            animateObject($ele, 36);
        }

    },
    update: function(element, valueAccessor) {
        var value = ko.unwrap(valueAccessor());
        var $ele = $(element);
        if (value) {
            $ele.show();
            animateObject($ele, 36);
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