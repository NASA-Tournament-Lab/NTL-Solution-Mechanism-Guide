/**
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 * @version 1.0
 * @author TCSASSEMBLER
 */


//jquery script
var preloaderTimer, running= false;
var loaderTimer =2000;
$(document).ready(function() {


	//ajax mock modal window loader
    var blockUI = function () {
        var $elem = $('.block-ui');
        if (!$elem.length) {
            $elem = $('<div class="block-ui"><span class="percentage"></span></div>');
            $('body').append($elem);
        }
        $elem.show();
        $elem.width($(window).width());
        $elem.height($(window).height());
    };
	window.blockUI = blockUI;
	//hide ui block
    var unBlockUI = function () {
        $('.block-ui').hide();
    };

    window.unBlockUI = unBlockUI;

	var processbar = function (callback) {
        var $elem = $('.process');
        if (!$elem.length) {
            $elem = $('<div class="process"><div class="processbg"><div class="processbar"></div><div class="processtext"></div></div></div>');
            $('body').append($elem);
        }
        $elem.show();
		$elem.find(".processbar").width("0");
		$elem.find(".processbar").animate({width:"100%" },{
			duration: loaderTimer,
			step: function( currentWidth ){
				$elem.find(".processtext").text(parseInt(currentWidth)+"%");
				console.log( "Width: ", parseInt(currentWidth) );
			},
			complete:function(){
				if(callback) (callback)();
			}
		});

    };
	
	//hide ui block
    var unProcessbar = function () {
        $('.process').hide();
    };

	//show modal window
	var showModal = function ($elem) {
		if ($elem) {
			$elem.show();
			$elem.removeClass('hide');
		}

		$("#modal-window-bg").show();
		$("#modal-window-bg").removeClass('hide');

        var availableWidth = $(window).width() - $elem.width();
        $elem.css('left', availableWidth/2 + 'px');
		var browserH = $(window).height();
		var modalH = $elem.height();
		var newY = Math.round(browserH / 2);
		newY -= Math.round(modalH / 2);
		if (newY<=20) newY = 20;
		$elem.css("top", newY);
	};
	window.showModal = showModal;
	//hide modal window
	var hideModal = function ($elem) {
		if ($elem) {
			$elem.hide();
		}
		$("#modal-window-bg").hide();
	};
    window.hideModal = hideModal;


	//click ".close-popup" to hide modal window
	$('.close-popup').click(function () {
		hideModal($(this).closest('.popup-element'));
	});
	
	//click ".tooltip-close" to hide modal window
    $(document).on('click', '.tooltip-close', function () {
        hideModal($(this).closest('.modal-window-wrapper'));
    });

	//pupop for help icon
    $(document).on("mouseover", ".help-icon", function() {
        $(this).next(".tool-tip").css("display", "block");
    });
    $(document).on("mouseleave", ".help-icon", function() {
        $(this).next(".tool-tip").css("display", "none");
    });

    //pupop for help icon
    $(document).on("mouseover", ".tooltip-icon", function() {
        $("#tooltip").show();
        $("#tooltip .tooltip-head p").text($(this).attr('data-val'));
		var pos = $(this).offset();
		$("#tooltip").css({
			left:pos.left+30,
			top:pos.top-8
		})
    });
    $(document).on("mouseleave", ".tooltip-icon", function() {
        $("#tooltip").hide();
    });
	
	//pupop for tool tip
    $(document).on("mouseover", ".tool-tip", function() {
        $(this).css("display", "block");
    });
    $(document).on("mouseleave", ".tool-tip", function() {
        $(this).css("display", "none");
    });

	
	 $("#tooltip").hover(function() {
        $(this).css("display", "block");
    }, function() {
        $(this).css("display", "none");
    });
	
	//close tooltip
    $(document).on('click', ".tooltip-middle .tooltip-head .tooltip-close",  function() {
        $(this).closest(".tool-tip").css("display", "none");
    });
	
	//init modal window background
    $("#modal-window-bg").css("width", "100%");
    $("#modal-window-bg").css("height", "100%");

    $(document).on('click', ".modal-close-btn", function() {
        $("#modal-window-bg").hide().removeClass('hide');
        $("#agreement-popup").hide().removeClass('hide');
    });


    //window width script
    var width=$(window).width();
    var height=$(window).height();
	var trueHeight = height - $("#footer-container").height() - $("#shownav").height() - $("#header").height() +20;
    $(".wrapper.height-adjust").css("min-height", trueHeight);
	
	
/********************* new added ************************/
	//file transparent
	$(".file-field :file").css("opacity", "0.001");

	//edit help topic
	$(".js-action-edit-topic").on("click", function(){
		$(".page").addClass("hide");
		$(".page-edit-help").removeClass("hide");
	});
	
	//cancel help topic
	$(".js-action-cancel-topic").on("click", function(){
		$(".page").addClass("hide");
		$(".page-help-dashboard").removeClass("hide");
		$(".page-help-dashboard .tabs ul li:first a").trigger("click");
	});

});

//url request
var Request = {
		QueryString : function(item){
			var sValue = location.search.match(new RegExp("[\?\&]" + item +"=([^\&]*)(\&?)","i"));
			return sValue ? sValue[1] : sValue;
		}	
	}

//get file name
var getFileName = function(url) {
    var tmp,last;
    last = url.lastIndexOf('\\');
    tmp = url.substring(last + 1, url.length);
    return tmp;
}

//clear animation
var clearAnimation = function(obj){
	running = false;
	if(obj) obj.css({backgroundPositionY: ""});
	if(preloaderTimer) clearInterval(preloaderTimer);
};

