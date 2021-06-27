/**
 * fullPage 2.5.4
 * https://github.com/alvarotrigo/fullPage.js
 * MIT licensed
 *
 * Copyright (C) 2013 alvarotrigo.com - A project by Alvaro Trigo
 */

(function($) {
	$.fn.fullpage = function(options) {
		// Create some defaults, extending them with any options that were provided
		options = $.extend({
			//navigation
			'menu': false,
			'anchors':[],
			'navigation': false,
			'navigationPosition': 'right',
			'navigationColor': '#000',
			'navigationTooltips': [],
			'slidesNavigation': false,
			'slidesNavPosition': 'bottom',
			'scrollBar': false,

			//scrolling
			'css3': true,
			'scrollingSpeed': 700,
			'autoScrolling': true,
			'easing': 'easeInQuart',
			'easingcss3': 'ease',
			'loopBottom': false,
			'loopTop': false,
			'loopHorizontal': true,
			'continuousVertical': false,
			'normalScrollElements': null,
			'scrollOverflow': false,
			'touchSensitivity': 5,
			'normalScrollElementTouchThreshold': 5,

			//Accessibility
			'keyboardScrolling': true,
			'animateAnchor': true,
			'recordHistory': true,

			//design
			'controlArrows': true,
			'controlArrowColor': '#fff',
			"verticalCentered": true,
			'resize': true,
			'sectionsColor' : [],
			'paddingTop': 0,
			'paddingBottom': 0,
			'fixedElements': null,
			'responsive': 0,

			//Custom selectors
			'sectionSelector': '.section',
			'slideSelector': '.slide',


			//events
			'afterLoad': null,
			'onLeave': null,
			'afterRender': null,
			'afterResize': null,
			'afterReBuild': null,
			'afterSlideLoad': null,
			'onSlideLeave': null
		}, options);

	    displayWarnings();

	    //easeInQuart animation included in the plugin
	    $.extend($.easing,{ easeInQuart: function (x, t, b, c, d) { return c*(t/=d)*t*t*t + b; }});

		//Defines the delay to take place before being able to scroll to the next section
		//BE CAREFUL! Not recommened to change it under 400 for a good behavior in laptops and
		//Apple devices (laptops, mouses...)
		var scrollDelay = 600;

		$.fn.fullpage.setAutoScrolling = function(value, type){
			setVariableState('autoScrolling', value, type);

			var element = $('.fp-section.active');

			if(options.autoScrolling && !options.scrollBar){
				$('html, body').css({
					'overflow' : 'hidden',
					'height' : '100%'
				});

				$.fn.fullpage.setRecordHistory(options.recordHistory, 'internal');

				//for IE touch devices
				container.css({
					'-ms-touch-action': 'none',
					'touch-action': 'none'
				});

				if(element.length){
					//moving the container up
					silentScroll(element.position().top);
				}

			}else{
				$('html, body').css({
					'overflow' : 'visible',
					'height' : 'initial'
				});

				$.fn.fullpage.setRecordHistory(false, 'internal');

				//for IE touch devices
				container.css({
					'-ms-touch-action': '',
					'touch-action': ''
				});

				silentScroll(0);

				//scrolling the page to the section with no animation
				$('html, body').scrollTop(element.position().top);
			}

		};

		/**
		* Defines wheter to record the history for each hash change in the URL.
		*/
		$.fn.fullpage.setRecordHistory = function(value, type){
			setVariableState('recordHistory', value, type);
		};

		/**
		* Defines the scrolling speed
		*/
		$.fn.fullpage.setScrollingSpeed = function(value, type){
			setVariableState('scrollingSpeed', value, type);
		};

		/**
		* Adds or remove the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
		*/
		$.fn.fullpage.setMouseWheelScrolling = function (value){
			if(value){
				addMouseWheelHandler();
			}else{
				removeMouseWheelHandler();
			}
		};

		/**
		* Adds or remove the possiblity of scrolling through sections by using the mouse wheel/trackpad or touch gestures.
		* Optionally a second parameter can be used to specify the direction for which the action will be applied.
		*
		* @param directions string containing the direction or directions separated by comma.
		*/
		$.fn.fullpage.setAllowScrolling = function (value, directions){
			if(typeof directions != 'undefined'){
				directions = directions.replace(' ', '').split(',');
				$.each(directions, function (index, direction){
					setIsScrollable(value, direction);
				});
			}
			else if(value){
				$.fn.fullpage.setMouseWheelScrolling(true);
				addTouchHandler();
			}else{
				$.fn.fullpage.setMouseWheelScrolling(false);
				removeTouchHandler();
			}
		};

		/**
		* Adds or remove the possiblity of scrolling through sections by using the keyboard arrow keys
		*/
		$.fn.fullpage.setKeyboardScrolling = function (value){
			options.keyboardScrolling = value;
		};

		$.fn.fullpage.moveSectionUp = function(){
			var prev = $('.fp-section.active').prev('.fp-section');

			//looping to the bottom if there's no more sections above
			if (!prev.length && (options.loopTop || options.continuousVertical)) {
				prev = $('.fp-section').last();
			}

			if (prev.length) {
				scrollPage(prev, null, true);
			}
		};

		$.fn.fullpage.moveSectionDown = function (){
			var next = $('.fp-section.active').next('.fp-section');

			//looping to the top if there's no more sections below
			if(!next.length &&
				(options.loopBottom || options.continuousVertical)){
				next = $('.fp-section').first();
			}

			if(next.length){
				scrollPage(next, null, false);
			}
		};

		$.fn.fullpage.moveTo = function (section, slide){
			var destiny = '';

			if(isNaN(section)){
				destiny = $('[data-anchor="'+section+'"]');
			}else{
				destiny = $('.fp-section').eq( (section -1) );
			}

			if (typeof slide !== 'undefined'){
				scrollPageAndSlide(section, slide);
			}else if(destiny.length > 0){
				scrollPage(destiny);
			}
		};

		$.fn.fullpage.moveSlideRight = function(){
			moveSlide('next');
		};

		$.fn.fullpage.moveSlideLeft = function(){
			moveSlide('prev');
		};

		/**
		 * When resizing is finished, we adjust the slides sizes and positions
		 */
		$.fn.fullpage.reBuild = function(resizing){
			isResizing = true;

			var windowsWidth = $(window).width();
			windowsHeight = $(window).height();  //updating global var

			//text and images resizing
			if (options.resize) {
				resizeMe(windowsHeight, windowsWidth);
			}

			$('.fp-section').each(function(){
				var scrollHeight = windowsHeight - parseInt($(this).css('padding-bottom')) - parseInt($(this).css('padding-top'));

				//adjusting the height of the table-cell for IE and Firefox
				if(options.verticalCentered){
					$(this).find('.fp-tableCell').css('height', getTableHeight($(this)) + 'px');
				}

				$(this).css('height', windowsHeight + 'px');

				//resizing the scrolling divs
				if(options.scrollOverflow){
					var slides = $(this).find('.fp-slide');

					if(slides.length){
						slides.each(function(){
							createSlimScrolling($(this));
						});
					}else{
						createSlimScrolling($(this));
					}
				}

				//adjusting the position fo the FULL WIDTH slides...
				var slides = $(this).find('.fp-slides');
				if (slides.length) {
					landscapeScroll(slides, slides.find('.fp-slide.active'));
				}
			});

			//adjusting the position for the current section
			var destinyPos = $('.fp-section.active').position();

			var activeSection = $('.fp-section.active');

			//isn't it the first section?
			if(activeSection.index('.fp-section')){
				scrollPage(activeSection);
			}

			isResizing = false;
			$.isFunction( options.afterResize ) && resizing && options.afterResize.call( this )
			$.isFunction( options.afterReBuild ) && !resizing && options.afterReBuild.call( this );
		}

		//flag to avoid very fast sliding for landscape sliders
		var slideMoving = false;

		var isTouchDevice = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|Windows Phone|Tizen|Bada)/);
		var isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints));
		var container = $(this);
		var windowsHeight = $(window).height();
		var isMoving = false;
		var isResizing = false;
		var lastScrolledDestiny;
		var lastScrolledSlide;
		var nav;
		var wrapperSelector = 'fullpage-wrapper';
		var isScrollAllowed = { 'up':true, 'down':true, 'left':true, 'right':true };
		var originals = jQuery.extend(true, {}, options); //deep copy

		$.fn.fullpage.setAllowScrolling(true);

		//if css3 is not supported, it will use jQuery animations
		if(options.css3){
			options.css3 = support3d();
		}

		if($(this).length){
			container.css({
				'height': '100%',
				'position': 'relative'
			});

			//adding a class to recognize the container internally in the code
			container.addClass(wrapperSelector);
		}

		//trying to use fullpage without a selector?
		else{
			showError('error', "Error! Fullpage.js needs to be initialized with a selector. For example: $('#myContainer').fullpage();");
		}

		//adding internal class names to void problem with common ones
		$(options.sectionSelector).each(function(){
  			$(this).addClass('fp-section');
		});
		$(options.slideSelector).each(function(){
  			$(this).addClass('fp-slide');
		});

		//creating the navigation dots
		if (options.navigation) {
			addVerticalNavigation();
		}

		$('.fp-section').each(function(index){
			var that = $(this);
			var slides = $(this).find('.fp-slide');
			var numSlides = slides.length;

			//if no active section is defined, the 1st one will be the default one
			if(!index && $('.fp-section.active').length === 0) {
				$(this).addClass('active');
			}

			$(this).css('height', windowsHeight + 'px');

			if(options.paddingTop || options.paddingBottom){
				$(this).css('padding', options.paddingTop  + ' 0 ' + options.paddingBottom + ' 0');
			}

			if (typeof options.sectionsColor[index] !==  'undefined') {
				$(this).css('background-color', options.sectionsColor[index]);
			}

			if (typeof options.anchors[index] !== 'undefined') {
				$(this).attr('data-anchor', options.anchors[index]);
			}

			// if there's any slide
			if (numSlides > 1) {
				var sliderWidth = numSlides * 100;
				var slideWidth = 100 / numSlides;

				slides.wrapAll('<div class="fp-slidesContainer" />');
				slides.parent().wrap('<div class="fp-slides" />');

				$(this).find('.fp-slidesContainer').css('width', sliderWidth + '%');

				if(options.controlArrows){
					createSlideArrows($(this));
				}

				if(options.slidesNavigation){
					addSlidesNavigation($(this), numSlides);
				}

				slides.each(function(index) {
					$(this).css('width', slideWidth + '%');

					if(options.verticalCentered){
						addTableClass($(this));
					}
				});

				var startingSlide = that.find('.fp-slide.active');

				//if the slide won#t be an starting point, the default will be the first one
				if(startingSlide.length == 0){
					slides.eq(0).addClass('active');
				}

				//is there a starting point for a non-starting section?
				else{
					silentLandscapeScroll(startingSlide);
				}

			}else{
				if(options.verticalCentered){
					addTableClass($(this));
				}
			}

		}).promise().done(function(){
			$.fn.fullpage.setAutoScrolling(options.autoScrolling, 'internal');

			//the starting point is a slide?
			var activeSlide = $('.fp-section.active').find('.fp-slide.active');

			//the active section isn't the first one? Is not the first slide of the first section? Then we load that section/slide by default.
			if( activeSlide.length &&  ($('.fp-section.active').index('.fp-section') != 0 || ($('.fp-section.active').index('.fp-section') == 0 && activeSlide.index() != 0))){
				silentLandscapeScroll(activeSlide);
			}

			//fixed elements need to be moved out of the plugin container due to problems with CSS3.
			if(options.fixedElements && options.css3){
				$(options.fixedElements).appendTo('body');
			}

			//vertical centered of the navigation + first bullet active
			if(options.navigation){
				nav.css('margin-top', '-' + (nav.height()/2) + 'px');
				nav.find('li').eq($('.fp-section.active').index('.fp-section')).find('a').addClass('active');
			}

			//moving the menu outside the main container if it is inside (avoid problems with fixed positions when using CSS3 tranforms)
			if(options.menu && options.css3 && $(options.menu).closest('.fullpage-wrapper').length){
				$(options.menu).appendTo('body');
			}

			if(options.scrollOverflow){
				if(document.readyState === "complete"){
					createSlimScrollingHandler();
				}
				//after DOM and images are loaded
				$(window).on('load', createSlimScrollingHandler);
			}else{
				$.isFunction( options.afterRender ) && options.afterRender.call( this);
			}

			responsive();

			//getting the anchor link in the URL and deleting the `#`
			var value =  window.location.hash.replace('#', '').split('/');
			var destiny = value[0];

			if(destiny.length){
				var section = $('[data-anchor="'+destiny+'"]');

				if(!options.animateAnchor && section.length){

					if(options.autoScrolling){
						silentScroll(section.position().top);
					}
					else{
						silentScroll(0);
						setBodyClass(destiny);

						//scrolling the page to the section with no animation
						$('html, body').scrollTop(section.position().top);
					}

					activateMenuAndNav(destiny, null);

					$.isFunction( options.afterLoad ) && options.afterLoad.call( this, destiny, (section.index('.fp-section') + 1));

					//updating the active class
					section.addClass('active').siblings().removeClass('active');
				}
			}


			$(window).on('load', function() {
				scrollToAnchor();
			});

		});


		/**
		* Creates the control arrows for the given section
		*/
		function createSlideArrows(section){
			section.find('.fp-slides').after('<div class="fp-controlArrow fp-prev"></div><div class="fp-controlArrow fp-next"></div>');

			if(options.controlArrowColor!='#fff'){
				section.find('.fp-controlArrow.fp-next').css('border-color', 'transparent transparent transparent '+options.controlArrowColor);
				section.find('.fp-controlArrow.fp-prev').css('border-color', 'transparent '+ options.controlArrowColor + ' transparent transparent');
			}

			if(!options.loopHorizontal){
				section.find('.fp-controlArrow.fp-prev').hide();
			}
		}

		/**
		* Creates a vertical navigation bar.
		*/
		function addVerticalNavigation(){
			$('body').append('<div id="fp-nav"><ul></ul></div>');
			nav = $('#fp-nav');

			nav.css('color', options.navigationColor);
			nav.addClass(options.navigationPosition);

			for (var i = 0; i < $('.fp-section').length; i++) {
				var link = '';
				if (options.anchors.length) {
					link = options.anchors[i];
				}

				var li = '<li><a href="#' + link + '"><span></span></a>';

				// Only add tooltip if needed (defined by user)
				var tooltip = options.navigationTooltips[i];
				if (tooltip != undefined && tooltip != '') {
					li += '<div class="fp-tooltip ' + options.navigationPosition + '">' + tooltip + '</div>';
				}

				li += '</li>';

				nav.find('ul').append(li);
			}
		}

		function createSlimScrollingHandler(){
			$('.fp-section').each(function(){
				var slides = $(this).find('.fp-slide');

				if(slides.length){
					slides.each(function(){
						createSlimScrolling($(this));
					});
				}else{
					createSlimScrolling($(this));
				}

			});
			$.isFunction( options.afterRender ) && options.afterRender.call( this);
		}

		var scrollId;
		var scrollId2;
		var isScrolling = false;

		//when scrolling...
		$(window).on('scroll', scrollHandler);

		function scrollHandler(){
			if(!options.autoScrolling || options.scrollBar){
				var currentScroll = $(window).scrollTop();
				var visibleSectionIndex = 0;
				var initial = Math.abs(currentScroll - $('.fp-section').first().offset().top);

				//taking the section which is showing more content in the viewport
				$('.fp-section').each(function(index){
					var current = Math.abs(currentScroll - $(this).offset().top);

					if(current < initial){
						visibleSectionIndex = index;
						initial = current;
					}
				});

				//geting the last one, the current one on the screen
				var currentSection = $('.fp-section').eq(visibleSectionIndex);
			}

			if(!options.autoScrolling){
				//executing only once the first time we reach the section
				if(!currentSection.hasClass('active')){
					isScrolling = true;

					var leavingSection = $('.fp-section.active').index('.fp-section') + 1;
					var yMovement = getYmovement(currentSection);
					var anchorLink  = currentSection.data('anchor');
					var sectionIndex = currentSection.index('.fp-section') + 1;
					var activeSlide = currentSection.find('.fp-slide.active');

					if(activeSlide.length){
						var slideAnchorLink = activeSlide.data('anchor');
						var slideIndex = activeSlide.index();
					}

					currentSection.addClass('active').siblings().removeClass('active');

					if(!isMoving){
						$.isFunction( options.onLeave ) && options.onLeave.call( this, leavingSection, sectionIndex, yMovement);

						$.isFunction( options.afterLoad ) && options.afterLoad.call( this, anchorLink, sectionIndex);
					}

					activateMenuAndNav(anchorLink, 0);

					if(options.anchors.length && !isMoving){
						//needed to enter in hashChange event when using the menu with anchor links
						lastScrolledDestiny = anchorLink;

						setState(slideIndex, slideAnchorLink, anchorLink, sectionIndex);
					}

					//small timeout in order to avoid entering in hashChange event when scrolling is not finished yet
					clearTimeout(scrollId);
					scrollId = setTimeout(function(){
						isScrolling = false;
					}, 100);
				}
			}

			if(options.scrollBar){
				//for the auto adjust of the viewport to fit a whole section
				clearTimeout(scrollId2);
				scrollId2 = setTimeout(function(){
					if(!isMoving){
						scrollPage(currentSection);
					}
				}, 1000);
			}
		}


		/**
		* Determines whether the active section or slide is scrollable through and scrolling bar
		*/
		function isScrollable(activeSection){
			//if there are landscape slides, we check if the scrolling bar is in the current one or not
			if(activeSection.find('.fp-slides').length){
				scrollable= activeSection.find('.fp-slide.active').find('.fp-scrollable');
			}else{
				scrollable = activeSection.find('.fp-scrollable');
			}

			return scrollable;
		}

		/**
		* Determines the way of scrolling up or down:
		* by 'automatically' scrolling a section or by using the default and normal scrolling.
		*/
		function scrolling(type, scrollable){
			if (!isScrollAllowed[type]){
				return;
			}

			if(type == 'down'){
				var check = 'bottom';
				var scrollSection = $.fn.fullpage.moveSectionDown;
			}else{
				var check = 'top';
				var scrollSection = $.fn.fullpage.moveSectionUp;
			}

			if(scrollable.length > 0 ){
				//is the scrollbar at the start/end of the scroll?
				if(isScrolled(check, scrollable)){
					scrollSection();
				}else{
					return true;
				}
			}else{
				// moved up/down
				scrollSection();
			}
		}


		var touchStartY = 0;
		var touchStartX = 0;
		var touchEndY = 0;
		var touchEndX = 0;

		/* Detecting touch events

		* As we are changing the top property of the page on scrolling, we can not use the traditional way to detect it.
		* This way, the touchstart and the touch moves shows an small difference between them which is the
		* used one to determine the direction.
		*/
		function touchMoveHandler(event){
			var e = event.originalEvent;

			// additional: if one of the normalScrollElements isn't within options.normalScrollElementTouchThreshold hops up the DOM chain
			if (!checkParentForNormalScrollElement(event.target)) {

				if(options.autoScrolling && !options.scrollBar){
					//preventing the easing on iOS devices
					event.preventDefault();
				}

				var activeSection = $('.fp-section.active');
				var scrollable = isScrollable(activeSection);

				if (!isMoving && !slideMoving) { //if theres any #
					var touchEvents = getEventsPage(e);

					touchEndY = touchEvents['y'];
					touchEndX = touchEvents['x'];

					//if movement in the X axys is greater than in the Y and the currect section has slides...
					if (activeSection.find('.fp-slides').length && Math.abs(touchStartX - touchEndX) > (Math.abs(touchStartY - touchEndY))) {

					    //is the movement greater than the minimum resistance to scroll?
					    if (Math.abs(touchStartX - touchEndX) > ($(window).width() / 100 * options.touchSensitivity)) {
					        if (touchStartX > touchEndX) {
					        	if(isScrollAllowed.right){
					            	$.fn.fullpage.moveSlideRight(); //next
					            }
					        } else {
					        	if(isScrollAllowed.left){
					            	$.fn.fullpage.moveSlideLeft(); //prev
					            }
					        }
					    }
					}

					//vertical scrolling (only when autoScrolling is enabled)
					else if(options.autoScrolling && !options.scrollBar){

						//is the movement greater than the minimum resistance to scroll?
						if (Math.abs(touchStartY - touchEndY) > ($(window).height() / 100 * options.touchSensitivity)) {
							if (touchStartY > touchEndY) {
								scrolling('down', scrollable);
							} else if (touchEndY > touchStartY) {
								scrolling('up', scrollable);
							}
						}
					}
				}
			}

		}

		/**
		 * recursive function to loop up the parent nodes to check if one of them exists in options.normalScrollElements
		 * Currently works well for iOS - Android might need some testing
		 * @param  {Element} el  target element / jquery selector (in subsequent nodes)
		 * @param  {int}     hop current hop compared to options.normalScrollElementTouchThreshold
		 * @return {boolean} true if there is a match to options.normalScrollElements
		 */
		function checkParentForNormalScrollElement (el, hop) {
			hop = hop || 0;
			var parent = $(el).parent();

			if (hop < options.normalScrollElementTouchThreshold &&
				parent.is(options.normalScrollElements) ) {
				return true;
			} else if (hop == options.normalScrollElementTouchThreshold) {
				return false;
			} else {
				return checkParentForNormalScrollElement(parent, ++hop);
			}
		}

		function touchStartHandler(event){
			var e = event.originalEvent;

			var touchEvents = getEventsPage(e);
			touchStartY = touchEvents['y'];
			touchStartX = touchEvents['x'];
		}


		/**
		 * Detecting mousewheel scrolling
		 *
		 * http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
		 * http://www.sitepoint.com/html5-javascript-mouse-wheel/
		 */
		function MouseWheelHandler(e) {
			if(options.autoScrolling){
				// cross-browser wheel delta
				e = window.event || e;
				var delta = Math.max(-1, Math.min(1,
						(e.wheelDelta || -e.deltaY || -e.detail)));

				//preventing to scroll the site on mouse wheel when scrollbar is present
				if(options.scrollBar){
					e.preventDefault ? e.preventDefault() : e.returnValue = false;

				}

				var activeSection = $('.fp-section.active');
				var scrollable = isScrollable(activeSection);

				if (!isMoving) { //if theres any #
					//scrolling down?
					if (delta < 0) {
						scrolling('down', scrollable);

					//scrolling up?
					}else {
						scrolling('up', scrollable);
					}
				}

				return false;
			}
		}

		function moveSlide(direction){
		    var activeSection = $('.fp-section.active');
		    var slides = activeSection.find('.fp-slides');

		    // more than one slide needed and nothing should be sliding
			if (!slides.length || slideMoving) {
			    return;
			}

		    var currentSlide = slides.find('.fp-slide.active');
		    var destiny = null;

		    if(direction === 'prev'){
		        destiny = currentSlide.prev('.fp-slide');
		    }else{
		        destiny = currentSlide.next('.fp-slide');
		    }

		    //isn't there a next slide in the secuence?
			if(!destiny.length){
				//respect loopHorizontal settin
				if (!options.loopHorizontal) return;

			    if(direction === 'prev'){
			        destiny = currentSlide.siblings(':last');
			    }else{
			        destiny = currentSlide.siblings(':first');
			    }
			}

		    slideMoving = true;

		    landscapeScroll(slides, destiny);
		}

		/**
		* Maintains the active slides in the viewport
		* (Because he `scroll` animation might get lost with some actions, such as when using continuousVertical)
		*/
		function keepSlidesPosition(){
			$('.fp-slide.active').each(function(){
				silentLandscapeScroll($(this));
			});
		}

		/**
		* Scrolls the site to the given element and scrolls to the slide if a callback is given.
		*/
		function scrollPage(element, callback, isMovementUp){
			var dest = element.position();
			if(typeof dest === "undefined"){ return; } //there's no element to scroll, leaving the function

			//local variables
			var v = {
				element: element,
				callback: callback,
				isMovementUp: isMovementUp,
				dest: dest,
				dtop: dest.top,
				yMovement: getYmovement(element),
				anchorLink: element.data('anchor'),
				sectionIndex: element.index('.fp-section'),
				activeSlide: element.find('.fp-slide.active'),
				activeSection: $('.fp-section.active'),
				leavingSection: $('.fp-section.active').index('.fp-section') + 1,

				//caching the value of isResizing at the momment the function is called
				//because it will be checked later inside a setTimeout and the value might change
				localIsResizing: isResizing
			};

			//quiting when destination scroll is the same as the current one
			if((v.activeSection.is(element) && !isResizing) || (options.scrollBar && $(window).scrollTop() === v.dtop)){ return; }

			if(v.activeSlide.length){
				var slideAnchorLink = v.activeSlide.data('anchor');
				var slideIndex = v.activeSlide.index();
			}

			// If continuousVertical && we need to wrap around
			if (options.autoScrolling && options.continuousVertical && typeof (v.isMovementUp) !== "undefined" &&
				((!v.isMovementUp && v.yMovement == 'up') || // Intending to scroll down but about to go up or
				(v.isMovementUp && v.yMovement == 'down'))) { // intending to scroll up but about to go down

				v = createInfiniteSections(v);
			}

			element.addClass('active').siblings().removeClass('active');

			//preventing from activating the MouseWheelHandler event
			//more than once if the page is scrolling
			isMoving = true;

			setState(slideIndex, slideAnchorLink, v.anchorLink, v.sectionIndex);

			//callback (onLeave) if the site is not just resizing and readjusting the slides
			$.isFunction(options.onLeave) && !v.localIsResizing && options.onLeave.call(this, v.leavingSection, (v.sectionIndex + 1), v.yMovement);

			performMovement(v);

			//flag to avoid callingn `scrollPage()` twice in case of using anchor links
			lastScrolledDestiny = v.anchorLink;

			//avoid firing it twice (as it does also on scroll)
			if(options.autoScrolling){
				activateMenuAndNav(v.anchorLink, v.sectionIndex)
			}
		}

		/**
		* Performs the movement (by CSS3 or by jQuery)
		*/
		function performMovement(v){
			// using CSS3 translate functionality
			if (options.css3 && options.autoScrolling && !options.scrollBar) {

				var translate3d = 'translate3d(0px, -' + v.dtop + 'px, 0px)';
				transformContainer(translate3d, true);

				setTimeout(function () {
					afterSectionLoads(v);
				}, options.scrollingSpeed);
			}

			// using jQuery animate
			else{
				var scrollSettings = getScrollSettings(v);

				$(scrollSettings.element).animate(
					scrollSettings.options
				, options.scrollingSpeed, options.easing).promise().done(function () { //only one single callback in case of animating  `html, body`
					afterSectionLoads(v);
				});
			}
		}

		/**
		* Gets the scrolling settings depending on the plugin autoScrolling option
		*/
		function getScrollSettings(v){
			var scroll = {};

			if(options.autoScrolling && !options.scrollBar){
				scroll.options = { 'top': -v.dtop};
				scroll.element = '.'+wrapperSelector;
			}else{
				scroll.options = { 'scrollTop': v.dtop};
				scroll.element = 'html, body';
			}

			return scroll;
		}

		/**
		* Adds sections before or after the current one to create the infinite effect.
		*/
		function createInfiniteSections(v){
			// Scrolling down
			if (!v.isMovementUp) {
				// Move all previous sections to after the active section
				$(".fp-section.active").after(v.activeSection.prevAll(".fp-section").get().reverse());
			}
			else { // Scrolling up
				// Move all next sections to before the active section
				$(".fp-section.active").before(v.activeSection.nextAll(".fp-section"));
			}

			// Maintain the displayed position (now that we changed the element order)
			silentScroll($('.fp-section.active').position().top);

			// Maintain the active slides visible in the viewport
			keepSlidesPosition();

			// save for later the elements that still need to be reordered
			v.wrapAroundElements = v.activeSection;

			// Recalculate animation variables
			v.dest = v.element.position();
			v.dtop = v.dest.top;
			v.yMovement = getYmovement(v.element);

			return v;
		}

		/**
		* Fix section order after continuousVertical changes have been animated
		*/
		function continuousVerticalFixSectionOrder (v) {
			// If continuousVertical is in effect (and autoScrolling would also be in effect then),
			// finish moving the elements around so the direct navigation will function more simply
			if (!v.wrapAroundElements || !v.wrapAroundElements.length) {
				return;
			}

			if (v.isMovementUp) {
				$('.fp-section:first').before(v.wrapAroundElements);
			}
			else {
				$('.fp-section:last').after(v.wrapAroundElements);
			}

			silentScroll($('.fp-section.active').position().top);

			// Maintain the active slides visible in the viewport
			keepSlidesPosition();
		};


		/**
		* Actions to do once the section is loaded
		*/
		function afterSectionLoads (v){
			continuousVerticalFixSectionOrder(v);
			//callback (afterLoad) if the site is not just resizing and readjusting the slides
			$.isFunction(options.afterLoad) && !v.localIsResizing && options.afterLoad.call(this, v.anchorLink, (v.sectionIndex + 1));

			setTimeout(function () {
				isMoving = false;
				$.isFunction(v.callback) && v.callback.call(this);
			}, scrollDelay);
		}


		/**
		* Scrolls to the anchor in the URL when loading the site
		*/
		function scrollToAnchor(){
			//getting the anchor link in the URL and deleting the `#`
			var value =  window.location.hash.replace('#', '').split('/');
			var section = value[0];
			var slide = value[1];

			if(section){  //if theres any #
				scrollPageAndSlide(section, slide);
			}
		}

		//detecting any change on the URL to scroll to the given anchor link
		//(a way to detect back history button as we play with the hashes on the URL)
		$(window).on('hashchange', hashChangeHandler);

		function hashChangeHandler(){
			if(!isScrolling){
				var value =  window.location.hash.replace('#', '').split('/');
				var section = value[0];
				var slide = value[1];

				if(section.length){
					//when moving to a slide in the first section for the first time (first time to add an anchor to the URL)
					var isFirstSlideMove =  (typeof lastScrolledDestiny === 'undefined');
					var isFirstScrollMove = (typeof lastScrolledDestiny === 'undefined' && typeof slide === 'undefined' && !slideMoving);

					/*in order to call scrollpage() only once for each destination at a time
					It is called twice for each scroll otherwise, as in case of using anchorlinks `hashChange`
					event is fired on every scroll too.*/
					if ((section && section !== lastScrolledDestiny) && !isFirstSlideMove || isFirstScrollMove || (!slideMoving && lastScrolledSlide != slide ))  {
						scrollPageAndSlide(section, slide);
					}
				}
			}
		}


		/**
		 * Sliding with arrow keys, both, vertical and horizontal
		 */
		$(document).keydown(function(e) {
			//Moving the main page with the keyboard arrows if keyboard scrolling is enabled
			if (options.keyboardScrolling && options.autoScrolling) {

				//preventing the scroll with arrow keys
				if(e.which == 40 || e.which == 38){
					e.preventDefault();
				}

				if(!isMoving){
					switch (e.which) {
						//up
						case 38:
						case 33:
							$.fn.fullpage.moveSectionUp();
							break;

						//down
						case 40:
						case 34:
							$.fn.fullpage.moveSectionDown();
							break;

						//Home
						case 36:
							$.fn.fullpage.moveTo(1);
							break;

						//End
						case 35:
							$.fn.fullpage.moveTo( $('.fp-section').length );
							break;

						//left
						case 37:
							$.fn.fullpage.moveSlideLeft();
							break;

						//right
						case 39:
							$.fn.fullpage.moveSlideRight();
							break;

						default:
							return; // exit this handler for other keys
					}
				}
			}
		});

		/**
		* Scrolls to the section when clicking the navigation bullet
		*/
		$(document).on('click touchstart', '#fp-nav a', function(e){
			e.preventDefault();
			var index = $(this).parent().index();
			scrollPage($('.fp-section').eq(index));
		});

		/**
		* Scrolls the slider to the given slide destination for the given section
		*/
		$(document).on('click touchstart', '.fp-slidesNav a', function(e){
			e.preventDefault();
			var slides = $(this).closest('.fp-section').find('.fp-slides');
			var destiny = slides.find('.fp-slide').eq($(this).closest('li').index());

			landscapeScroll(slides, destiny);
		});

		if(options.normalScrollElements){
			$(document).on('mouseenter', options.normalScrollElements, function () {
				$.fn.fullpage.setMouseWheelScrolling(false);
			});

			$(document).on('mouseleave', options.normalScrollElements, function(){
				$.fn.fullpage.setMouseWheelScrolling(true);
			});
		}

		/**
		 * Scrolling horizontally when clicking on the slider controls.
		 */
		$('.fp-section').on('click touchstart', '.fp-controlArrow', function() {
			if ($(this).hasClass('fp-prev')) {
				$.fn.fullpage.moveSlideLeft();
			} else {
				$.fn.fullpage.moveSlideRight();
			}
		});

		/**
		* Scrolls horizontal sliders.
		*/
		function landscapeScroll(slides, destiny){
			var destinyPos = destiny.position();
			var slidesContainer = slides.find('.fp-slidesContainer').parent();
			var slideIndex = destiny.index();
			var section = slides.closest('.fp-section');
			var sectionIndex = section.index('.fp-section');
			var anchorLink = section.data('anchor');
			var slidesNav = section.find('.fp-slidesNav');
			var slideAnchor = destiny.data('anchor');

			//caching the value of isResizing at the momment the function is called
			//because it will be checked later inside a setTimeout and the value might change
			var localIsResizing = isResizing;

			if(options.onSlideLeave){
				var prevSlideIndex = section.find('.fp-slide.active').index();
				var xMovement = getXmovement(prevSlideIndex, slideIndex);

				//if the site is not just resizing and readjusting the slides
				if(!localIsResizing && xMovement!=='none'){
					$.isFunction( options.onSlideLeave ) && options.onSlideLeave.call( this, anchorLink, (sectionIndex + 1), prevSlideIndex, xMovement);
				}
			}

			destiny.addClass('active').siblings().removeClass('active');


			if(typeof slideAnchor === 'undefined'){
				slideAnchor = slideIndex;
			}

			if(!options.loopHorizontal && options.controlArrows){
				//hidding it for the fist slide, showing for the rest
				section.find('.fp-controlArrow.fp-prev').toggle(slideIndex!=0);

				//hidding it for the last slide, showing for the rest
				section.find('.fp-controlArrow.fp-next').toggle(!destiny.is(':last-child'));
			}

			//only changing the URL if the slides are in the current section (not for resize re-adjusting)
			if(section.hasClass('active')){
				setState(slideIndex, slideAnchor, anchorLink, sectionIndex);
			}

			var afterSlideLoads = function(){
				//if the site is not just resizing and readjusting the slides
				if(!localIsResizing){
					$.isFunction( options.afterSlideLoad ) && options.afterSlideLoad.call( this, anchorLink, (sectionIndex + 1), slideAnchor, slideIndex);
				}
				//letting them slide again
				slideMoving = false;
			};

			if(options.css3){
				var translate3d = 'translate3d(-' + destinyPos.left + 'px, 0px, 0px)';

				addAnimation(slides.find('.fp-slidesContainer'), options.scrollingSpeed>0).css(getTransforms(translate3d));

				setTimeout(function(){
					afterSlideLoads();
				}, options.scrollingSpeed, options.easing);
			}else{
				slidesContainer.animate({
					scrollLeft : destinyPos.left
				}, options.scrollingSpeed, options.easing, function() {

					afterSlideLoads();
				});
			}

			slidesNav.find('.active').removeClass('active');
			slidesNav.find('li').eq(slideIndex).find('a').addClass('active');
		}

	    //when resizing the site, we adjust the heights of the sections, slimScroll...
	    $(window).resize(resizeHandler);

	    var previousHeight = windowsHeight;
	    var resizeId;
	    function resizeHandler(){
	    	//checking if it needs to get responsive
	    	responsive();

	    	// rebuild immediately on touch devices
			if (isTouchDevice) {

				//if the keyboard is visible
				if ($(document.activeElement).attr('type') !== 'text') {
					var currentHeight = $(window).height();

					//making sure the change in the viewport size is enough to force a rebuild. (20 % of the window to avoid problems when hidding scroll bars)
					if( Math.abs(currentHeight - previousHeight) > (20 * Math.max(previousHeight, currentHeight) / 100) ){
			        	$.fn.fullpage.reBuild(true);
			        	previousHeight = currentHeight;
			        }
		        }
	      	}else{
	      		//in order to call the functions only when the resize is finished
	    		//http://stackoverflow.com/questions/4298612/jquery-how-to-call-resize-event-only-once-its-finished-resizing
	      		clearTimeout(resizeId);

	        	resizeId = setTimeout(function(){
	        		$.fn.fullpage.reBuild(true);
	        	}, 500);
	      	}
	    }

	    /**
	    * Checks if the site needs to get responsive and disables autoScrolling if so.
	    * A class `fp-responsive` is added to the plugin's container in case the user wants to use it for his own responsive CSS.
	    */
	    function responsive(){
	    	if(options.responsive){
	    		var isResponsive = container.hasClass('fp-responsive');
	    		if ($(window).width() < options.responsive ){
	    			if(!isResponsive){
	    				$.fn.fullpage.setAutoScrolling(false, 'internal');
	    				$('#fp-nav').hide();
						container.addClass('fp-responsive');
	    			}
	    		}else if(isResponsive){
	    			$.fn.fullpage.setAutoScrolling(originals.autoScrolling, 'internal');
	    			$('#fp-nav').show();
					container.removeClass('fp-responsive');
	    		}
	    	}
	    }

	    /**
		* Adds transition animations for the given element
		*/
		function addAnimation(element){
			var transition = 'all ' + options.scrollingSpeed + 'ms ' + options.easingcss3;

			element.removeClass('fp-notransition');
			return element.css({
				'-webkit-transition': transition,
     			'transition': transition
       		});
		}

		/**
		* Remove transition animations for the given element
		*/
		function removeAnimation(element){
			return element.addClass('fp-notransition');
		}

		/**
		 * Resizing of the font size depending on the window size as well as some of the images on the site.
		 */
		function resizeMe(displayHeight, displayWidth) {
			//Standard dimensions, for which the body font size is correct
			var preferredHeight = 825;
			var preferredWidth = 900;

			if (displayHeight < preferredHeight || displayWidth < preferredWidth) {
				var heightPercentage = (displayHeight * 100) / preferredHeight;
				var widthPercentage = (displayWidth * 100) / preferredWidth;
				var percentage = Math.min(heightPercentage, widthPercentage);
				var newFontSize = percentage.toFixed(2);

				$("body").css("font-size", newFontSize + '%');
			} else {
				$("body").css("font-size", '100%');
			}
		}

		/**
		 * Activating the website navigation dots according to the given slide name.
		 */
		function activateNavDots(name, sectionIndex){
			if(options.navigation){
				$('#fp-nav').find('.active').removeClass('active');
				if(name){
					$('#fp-nav').find('a[href="#' + name + '"]').addClass('active');
				}else{
					$('#fp-nav').find('li').eq(sectionIndex).find('a').addClass('active');
				}
			}
		}

		/**
		 * Activating the website main menu elements according to the given slide name.
		 */
		function activateMenuElement(name){
			if(options.menu){
				$(options.menu).find('.active').removeClass('active');
				$(options.menu).find('[data-menuanchor="'+name+'"]').addClass('active');
			}
		}

		function activateMenuAndNav(anchor, index){
			activateMenuElement(anchor);
			activateNavDots(anchor, index);
		}

		/**
		* Return a boolean depending on whether the scrollable element is at the end or at the start of the scrolling
		* depending on the given type.
		*/
		function isScrolled(type, scrollable){
			if(type === 'top'){
				return !scrollable.scrollTop();
			}else if(type === 'bottom'){
				return scrollable.scrollTop() + 1 + scrollable.innerHeight() >= scrollable[0].scrollHeight;
			}
		}

		/**
		* Retuns `up` or `down` depending on the scrolling movement to reach its destination
		* from the current section.
		*/
		function getYmovement(destiny){
			var fromIndex = $('.fp-section.active').index('.fp-section');
			var toIndex = destiny.index('.fp-section');
			if( fromIndex == toIndex){
				return 'none'
			}
			if(fromIndex > toIndex){
				return 'up';
			}
			return 'down';
		}

		/**
		* Retuns `right` or `left` depending on the scrolling movement to reach its destination
		* from the current slide.
		*/
		function getXmovement(fromIndex, toIndex){
			if( fromIndex == toIndex){
				return 'none'
			}
			if(fromIndex > toIndex){
				return 'left';
			}
			return 'right';
		}


		function createSlimScrolling(element){
			//needed to make `scrollHeight` work under Opera 12
			element.css('overflow', 'hidden');

			//in case element is a slide
			var section = element.closest('.fp-section');
			var scrollable = element.find('.fp-scrollable');

			//if there was scroll, the contentHeight will be the one in the scrollable section
			if(scrollable.length){
				var contentHeight = scrollable.get(0).scrollHeight;
			}else{
				var contentHeight = element.get(0).scrollHeight;
				if(options.verticalCentered){
					contentHeight = element.find('.fp-tableCell').get(0).scrollHeight;
				}
			}

			var scrollHeight = windowsHeight - parseInt(section.css('padding-bottom')) - parseInt(section.css('padding-top'));

			//needs scroll?
			if ( contentHeight > scrollHeight) {
				//was there already an scroll ? Updating it
				if(scrollable.length){
					scrollable.css('height', scrollHeight + 'px').parent().css('height', scrollHeight + 'px');
				}
				//creating the scrolling
				else{
					if(options.verticalCentered){
						element.find('.fp-tableCell').wrapInner('<div class="fp-scrollable" />');
					}else{
						element.wrapInner('<div class="fp-scrollable" />');
					}

					element.find('.fp-scrollable').slimScroll({
						allowPageScroll: true,
						height: scrollHeight + 'px',
						size: '10px',
						alwaysVisible: true
					});
				}
			}

			//removing the scrolling when it is not necessary anymore
			else{
				removeSlimScroll(element);
			}

			//undo
			element.css('overflow', '');
		}

		function removeSlimScroll(element){
			element.find('.fp-scrollable').children().first().unwrap().unwrap();
			element.find('.slimScrollBar').remove();
			element.find('.slimScrollRail').remove();
		}

		function addTableClass(element){
			element.addClass('fp-table').wrapInner('<div class="fp-tableCell" style="height:' + getTableHeight(element) + 'px;" />');
		}

		function getTableHeight(element){
			var sectionHeight = windowsHeight;

			if(options.paddingTop || options.paddingBottom){
				var section = element;
				if(!section.hasClass('fp-section')){
					section = element.closest('.fp-section');
				}

				var paddings = parseInt(section.css('padding-top')) + parseInt(section.css('padding-bottom'));
				sectionHeight = (windowsHeight - paddings);
			}

			return sectionHeight;
		}

		/**
		* Adds a css3 transform property to the container class with or without animation depending on the animated param.
		*/
		function transformContainer(translate3d, animated){
			if(animated){
				addAnimation(container);
			}else{
				removeAnimation(container);
			}

			container.css(getTransforms(translate3d));

			//syncronously removing the class after the animation has been applied.
			setTimeout(function(){
				container.removeClass('fp-notransition');
			},10)
		}


		/**
		* Scrolls to the given section and slide
		*/
		function scrollPageAndSlide(destiny, slide){
			if (typeof slide === 'undefined') {
			    slide = 0;
			}

			if(isNaN(destiny)){
				var section = $('[data-anchor="'+destiny+'"]');
			}else{
				var section = $('.fp-section').eq( (destiny -1) );
			}


			//we need to scroll to the section and then to the slide
			if (destiny !== lastScrolledDestiny && !section.hasClass('active')){
				scrollPage(section, function(){
					scrollSlider(section, slide)
				});
			}
			//if we were already in the section
			else{
				scrollSlider(section, slide);
			}
		}

		/**
		* Scrolls the slider to the given slide destination for the given section
		*/
		function scrollSlider(section, slide){
			if(typeof slide != 'undefined'){
				var slides = section.find('.fp-slides');
				var destiny =  slides.find('[data-anchor="'+slide+'"]');

				if(!destiny.length){
					destiny = slides.find('.fp-slide').eq(slide);
				}

				if(destiny.length){
					landscapeScroll(slides, destiny);
				}
			}
		}

		/**
		* Creates a landscape navigation bar with dots for horizontal sliders.
		*/
		function addSlidesNavigation(section, numSlides){
			section.append('<div class="fp-slidesNav"><ul></ul></div>');
			var nav = section.find('.fp-slidesNav');

			//top or bottom
			nav.addClass(options.slidesNavPosition);

			for(var i=0; i< numSlides; i++){
				nav.find('ul').append('<li><a href="#"><span></span></a></li>');
			}

			//centering it
			nav.css('margin-left', '-' + (nav.width()/2) + 'px');

			nav.find('li').first().find('a').addClass('active');
		}


		/**
		* Sets the state of the website depending on the active section/slide.
		* It changes the URL hash when needed and updates the body class.
		*/
		function setState(slideIndex, slideAnchor, anchorLink, sectionIndex){
			var sectionHash = '';

			if(options.anchors.length){

				//isn't it the first slide?
				if(slideIndex){
					if(typeof anchorLink !== 'undefined'){
						sectionHash = anchorLink;
					}

					//slide without anchor link? We take the index instead.
					if(typeof slideAnchor === 'undefined'){
						slideAnchor = slideIndex;
					}

					lastScrolledSlide = slideAnchor;
					setUrlHash(sectionHash + '/' + slideAnchor);

				//first slide won't have slide anchor, just the section one
				}else if(typeof slideIndex !== 'undefined'){
					lastScrolledSlide = slideAnchor;
					setUrlHash(anchorLink);
				}

				//section without slides
				else{
					setUrlHash(anchorLink);
				}

				setBodyClass(location.hash);
			}
			else if(typeof slideIndex !== 'undefined'){
					setBodyClass(sectionIndex + '-' + slideIndex);
			}
			else{
				setBodyClass(String(sectionIndex));
			}
		}

		/**
		* Sets the URL hash.
		*/
		function setUrlHash(url){
			if(options.recordHistory){
				location.hash = url;
			}else{
				//Mobile Chrome doesn't work the normal way, so... lets use HTML5 for phones :)
				if(isTouchDevice || isTouch){
					history.replaceState(undefined, undefined, "#" + url)
				}else{
					var baseUrl = window.location.href.split('#')[0];
					window.location.replace( baseUrl + '#' + url );
				}
			}
		}

		/**
		* Sets a class for the body of the page depending on the active section / slide
		*/
		function setBodyClass(text){
			//changing slash for dash to make it a valid CSS style
			text = text.replace('/', '-').replace('#','');

			//removing previous anchor classes
			$("body")[0].className = $("body")[0].className.replace(/\b\s?fp-viewing-[^\s]+\b/g, '');

			//adding the current anchor
			$("body").addClass("fp-viewing-" + text);
		}

		/**
		* Checks for translate3d support
		* @return boolean
		* http://stackoverflow.com/questions/5661671/detecting-transform-translate3d-support
		*/
		function support3d() {
			var el = document.createElement('p'),
				has3d,
				transforms = {
					'webkitTransform':'-webkit-transform',
					'OTransform':'-o-transform',
					'msTransform':'-ms-transform',
					'MozTransform':'-moz-transform',
					'transform':'transform'
				};

			// Add it to the body to get the computed style.
			document.body.insertBefore(el, null);

			for (var t in transforms) {
				if (el.style[t] !== undefined) {
					el.style[t] = "translate3d(1px,1px,1px)";
					has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
				}
			}

			document.body.removeChild(el);

			return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
		}



		/**
		* Removes the auto scrolling action fired by the mouse wheel and trackpad.
		* After this function is called, the mousewheel and trackpad movements won't scroll through sections.
		*/
		function removeMouseWheelHandler(){
			if (document.addEventListener) {
				document.removeEventListener('mousewheel', MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
				document.removeEventListener('wheel', MouseWheelHandler, false); //Firefox
			} else {
				document.detachEvent("onmousewheel", MouseWheelHandler); //IE 6/7/8
			}
		}


		/**
		* Adds the auto scrolling action for the mouse wheel and trackpad.
		* After this function is called, the mousewheel and trackpad movements will scroll through sections
		*/
		function addMouseWheelHandler(){
			if (document.addEventListener) {
				document.addEventListener("mousewheel", MouseWheelHandler, false); //IE9, Chrome, Safari, Oper
				document.addEventListener("wheel", MouseWheelHandler, false); //Firefox
			} else {
				document.attachEvent("onmousewheel", MouseWheelHandler); //IE 6/7/8
			}
		}


		/**
		* Adds the possibility to auto scroll through sections on touch devices.
		*/
		function addTouchHandler(){
			if(isTouchDevice || isTouch){
				//Microsoft pointers
				MSPointer = getMSPointer();

				$(document).off('touchstart ' +  MSPointer.down).on('touchstart ' + MSPointer.down, touchStartHandler);
				$(document).off('touchmove ' + MSPointer.move).on('touchmove ' + MSPointer.move, touchMoveHandler);
			}
		}

		/**
		* Removes the auto scrolling for touch devices.
		*/
		function removeTouchHandler(){
			if(isTouchDevice || isTouch){
				//Microsoft pointers
				MSPointer = getMSPointer();

				$(document).off('touchstart ' + MSPointer.down);
				$(document).off('touchmove ' + MSPointer.move);
			}
		}


		/*
		* Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
		* http://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
		*/
		function getMSPointer(){
			var pointer;

			//IE >= 11 & rest of browsers
			if(window.PointerEvent){
				pointer = { down: "pointerdown", move: "pointermove"};
			}

			//IE < 11
			else{
				pointer = { down: "MSPointerDown", move: "MSPointerMove"};
			}

			return pointer;
		}
		/**
		* Gets the pageX and pageY properties depending on the browser.
		* https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
		*/
		function getEventsPage(e){
			var events = new Array();

			events['y'] = (typeof e.pageY !== 'undefined' && (e.pageY || e.pageX) ? e.pageY : e.touches[0].pageY);
			events['x'] = (typeof e.pageX !== 'undefined' && (e.pageY || e.pageX) ? e.pageX : e.touches[0].pageX);

			return events;
		}

		function silentLandscapeScroll(activeSlide){
			$.fn.fullpage.setScrollingSpeed (0, 'internal');
			landscapeScroll(activeSlide.closest('.fp-slides'), activeSlide);
			$.fn.fullpage.setScrollingSpeed(originals.scrollingSpeed, 'internal');
		}

		function silentScroll(top){
			if(options.scrollBar){
				container.scrollTop(top);
			}
			else if (options.css3) {
				var translate3d = 'translate3d(0px, -' + top + 'px, 0px)';
				transformContainer(translate3d, false);
			}
			else {
				container.css("top", -top);
			}
		}

		function getTransforms(translate3d){
			return {
				'-webkit-transform': translate3d,
				'-moz-transform': translate3d,
				'-ms-transform':translate3d,
				'transform': translate3d
			};
		}

		function setIsScrollable(value, direction){
			switch (direction){
				case 'up': isScrollAllowed.up = value; break;
				case 'down': isScrollAllowed.down = value; break;
				case 'left': isScrollAllowed.left = value; break;
				case 'right': isScrollAllowed.right = value; break;
				case 'all': $.fn.fullpage.setAllowScrolling(value);
			}
		}


		/*
		* Destroys fullpage.js plugin events and optinally its html markup and styles
		*/
		$.fn.fullpage.destroy = function(all){
			$.fn.fullpage.setAutoScrolling(false, 'internal');
 			$.fn.fullpage.setAllowScrolling(false);
 			$.fn.fullpage.setKeyboardScrolling(false);


 			$(window)
				.off('scroll', scrollHandler)
  				.off('hashchange', hashChangeHandler)
  				.off('resize', resizeHandler);

			$(document)
				.off('click', '#fp-nav a')
				.off('mouseenter', '#fp-nav li')
				.off('mouseleave', '#fp-nav li')
				.off('click', '.fp-slidesNav a')
  				.off('mouseover', options.normalScrollElements)
  				.off('mouseout', options.normalScrollElements);

			$('.fp-section')
				.off('click', '.fp-controlArrow');

			//lets make a mess!
			if(all){
				destroyStructure();
			}
 		};

 		/*
		* Removes inline styles added by fullpage.js
		*/
		function destroyStructure(){
			//reseting the `top` or `translate` properties to 0
	 		silentScroll(0);

			$('#fp-nav, .fp-slidesNav, .fp-controlArrow').remove();

			//removing inline styles
			$('.fp-section').css( {
				'height': '',
				'background-color' : '',
				'padding': ''
			});

			$('.fp-slide').css( {
				'width': ''
			});

			container.css({
	 			'height': '',
	 			'position': '',
	 			'-ms-touch-action': '',
	 			'touch-action': ''
	 		});

			//removing added classes
			$('.fp-section, .fp-slide').each(function(){
				removeSlimScroll($(this));
				$(this).removeClass('fp-table active');
			});

			removeAnimation(container);
			removeAnimation(container.find('.fp-easing'));

			//Unwrapping content
			container.find('.fp-tableCell, .fp-slidesContainer, .fp-slides').each(function(){
				//unwrap not being use in case there's no child element inside and its just text
				$(this).replaceWith(this.childNodes);
			});

			//scrolling the page to the top with no animation
			$('html, body').scrollTop(0);
		}

		/*
		* Sets the state for a variable with multiple states (original, and temporal)
		* Some variables such as `autoScrolling` or `recordHistory` might change automatically its state when using `responsive` or `autoScrolling:false`.
		* This function is used to keep track of both states, the original and the temporal one.
		* If type is not 'internal', then we assume the user is globally changing the variable.
		*/
		function setVariableState(variable, value, type){
			options[variable] = value;
			if(type !== 'internal'){
				originals[variable] = value;
			}
		}

		/**
		* Displays warnings
		*/
		function displayWarnings(){
			// Disable mutually exclusive settings
			if (options.continuousVertical &&
				(options.loopTop || options.loopBottom)) {
			    options.continuousVertical = false;
			    showError('warn', "Option `loopTop/loopBottom` is mutually exclusive with `continuousVertical`; `continuousVertical` disabled");
			}
			if(options.continuousVertical && options.scrollBar){
				options.continuousVertical = false;
				showError('warn', "Option `scrollBar` is mutually exclusive with `continuousVertical`; `continuousVertical` disabled");
			}

			//anchors can not have the same value as any element ID or NAME
			$.each(options.anchors, function(index, name){
				if($('#' + name).length || $('[name="'+name+'"]').length ){
					showError('error', "data-anchor tags can not have the same value as any `id` element on the site (or `name` element for IE).");
				}
			});
		}

		function showError(type, text){
			console && console[type] && console[type]('fullPage: ' + text);
		}
	};
})(jQuery);









( function( $ ) {
	var Timeline = {
		init : function(options, elem) {
			var self = this;

			self.$elem = $(elem);
			self.dom = $('body');
			self.wrapClass = '.'+self.$elem.attr('class').split(' ').join('.');
			self.dotsItem = self.wrapClass + " .timeline-dots li";
			self.options = $.extend({}, $.fn.Timeline.options, self.$elem.data(), options);

			self.create_timeline();
		},


		// Load Timeline
		// ----------------------------------------------------------------
		create_timeline : function(){
			var self = this;

			self.build_out();
			self.build_dots();
			self.watch_events();
		},


		// Get Total Items
		// ----------------------------------------------------------------
		get_count : function(){
			var self = this;

			var total = $('.' + self.options.itemClass, self.$elem).length;
			return total;
		},


		// Get Current Item Index
		// ----------------------------------------------------------------
		get_current : function(){
			var self = this;
			var nextItem;

			if (self.options.startItem === 'first') {
				nextItem = 0;
			} else if (self.options.startItem === 'last') {
				nextItem = self.get_count() - 1;
			} else {
				nextItem = self.options.startItem - 1;
			}

			return nextItem;
		},


		// Get Next Item Index
		// ----------------------------------------------------------------
		get_next : function(){
			var self = this;
			return self.get_current() + 1;
		},


		// Get Prev Item Index
		// ----------------------------------------------------------------
		get_prev : function(){
			var self = this;
			return self.get_current() - 1;
		},


		// Watch Timeline Events
		// ----------------------------------------------------------------
		watch_events : function(){
			var self = this;

			// Dots Click
			$(document.body).on('click',self.dotsItem, function(e){
				self.options.startItem = $(this).index() + 1;
				$(self.dotsItem).removeClass(self.options.activeClass);
				$(this).addClass(self.options.activeClass);
				self.change_timeline(self.get_current());
			});
		},


		// Make Timeline Calculations
		// ----------------------------------------------------------------
		timelime_calculations : function(){
			var self = this;

			var width = $(self.wrapClass + ' .timeline-list').width();
			var totalWidth = $(self.wrapClass + ' .' +self.options.itemClass).outerWidth() * (self.get_count());
			$(self.wrapClass + ' .timeline-list-wrap').width(totalWidth);

			if (self.options.mode === 'horizontal') {
				var leftTotal = -(width * self.get_current());
				$(self.wrapClass + ' .timeline-list-wrap').css({"transform": "translate3d(" + leftTotal + "px, 0px, 0px)"});
			}
		},


		// Make Timeline Dots Calculations
		// ----------------------------------------------------------------
		dots_calculations : function(){
			var self = this;
			var width = $(self.wrapClass + ' .timeline-dots li').outerWidth(true);
			var itemWidth = $(self.wrapClass + ' .timeline-list').width();

			var totalWidth = width * (self.get_count());
			$(self.wrapClass + ' .timeline-dots').width(totalWidth);

			if (self.options.mode === 'horizontal') {
				var leftTotal = -(width * self.get_current()) - (-itemWidth / 2);
				$(self.wrapClass + ' .timeline-dots').css({"transform": "translate3d(" + leftTotal + "px, 0px, 0px)"});
			}

			self.dots_position();

		},


		// Dots Position
		// ----------------------------------------------------------------
		dots_position : function(){
			var self = this;
			var dotsWrap = $(self.wrapClass + ' .timeline-dots-wrap')


			if (self.options.mode === 'horizontal') {
				if (self.options.dotsPosition === 'top') {
					dotsWrap.addClass('top')
				}else {
					dotsWrap.addClass('bottom')
				}
			}

		},



		// Build Timeline Dom
		// ----------------------------------------------------------------
		build_out : function(){
			var self = this;

			self.$elem.addClass('timeline-initialized');
			self.$elem.children().addClass(self.options.itemClass);
			self.$elem.children().wrapAll('<div class="timeline-list-wrap"/>').parent();
			self.$elem.children().wrap('<div class="timeline-list"/>').parent();

			$('.' + self.options.itemClass, self.$elem).eq(self.get_current()).addClass(self.options.activeClass);

			self.timelime_calculations();
			self.update_ui();
		},



		// Build Dots List
		// ----------------------------------------------------------------
		build_dots : function(){
			var self = this;
			var dot,itemDate;

			dot = $('<ul />').addClass('timeline-dots');


			for (i = 0; i <= (self.get_count() - 1); i += 1) {
				 itemDate = $(self.wrapClass + ' .' + self.options.itemClass).eq(i).data('time');
				 dot.append($('<li />').append(self.options.customPaging.call(this, self, itemDate)));
			}

			self.$dots = dot.appendTo(self.$elem);
			$(self.wrapClass + ' .timeline-dots').wrapAll('<div class="timeline-dots-wrap"/>').parent();

			self.dots_calculations();
			self.update_ui();
		},

		// Item Markup Class Update
		// ----------------------------------------------------------------
		update_ui : function(){
			var self = this;
			var timelineItem = $('.' + self.options.itemClass, self.$elem);
			var timelineDot = $(self.dotsItem);

			// Timeline Item UI
			timelineItem
				.removeClass(self.options.activeClass)
				.removeClass(self.options.prevClass)
				.removeClass(self.options.nextClass)

			timelineItem
				.eq(self.get_current())
				.addClass(self.options.activeClass);

			timelineItem
				.eq(self.get_prev())
				.addClass(self.options.prevClass);

			timelineItem
				.eq(self.get_next())
				.addClass(self.options.nextClass);


			// Timeline Dots UI
			timelineDot
				.removeClass(self.options.activeClass)
				.removeClass(self.options.prevClass)
				.removeClass(self.options.nextClass)

			timelineDot
				.eq(self.get_current())
				.addClass(self.options.activeClass);

			timelineDot
				.eq(self.get_prev())
				.addClass(self.options.prevClass);

			timelineDot
				.eq(self.get_next())
				.addClass(self.options.nextClass);
		},

		// Timeline Change
		// ----------------------------------------------------------------
		change_timeline : function(){
			var self = this;

			self.timelime_calculations();
			self.dots_calculations();
			self.update_ui();
		},
	}

	// jQuery method
	// ------------------------------------------------------------
	$.fn.Timeline = function(options) {
		return this.each(function () {
			var timeline = Object.create(Timeline);
			timeline.init(options, this);
			$.data(this, "timeline", timeline);
		});
	};


	// Default options
	// ------------------------------------------------------------
	$.fn.Timeline.options = {
		// GENERAL
		mode: 'horizontal', // vertical
		itemClass: 'timeline-item',
		dotsClass: 'timeline-dots',
		activeClass: 'slide-active',
		prevClass: 'slide-prev',
		nextClass: 'slide-next',
		startItem: 'first', // first|last|number
		dotsPosition: 'bottom', // bottom | top

		// CONTROLS
		customPaging: function(slider, date) {
			return $('<button type="button" role="button" />').text(date);
    	},
	};

} ( jQuery, window, document ) );












! function($, window, undefined) {
	"use strict";
	$.fn.tabslet = function(options) {
		var defaults = {
				mouseevent: "click",
				activeclass: "active",
				attribute: "href",
				animation: !1,
				autorotate: !1,
				deeplinking: !1,
				pauseonhover: !0,
				delay: 2e3,
				active: 1,
				container: !1,
				controls: {
					prev: ".prev",
					next: ".next"
				}
			},
			options = $.extend(defaults, options);
		return this.each(function() {
			function deep_link() {
				var t = [];
				elements.find("a").each(function() {
					t.push($(this).attr($this.opts.attribute))
				});
				var e = $.inArray(location.hash, t);
				return e > -1 ? e + 1 : $this.data("active") || options.active
			}
			var $this = $(this),
				_cache_li = [],
				_cache_div = [],
				_container = options.container ? $(options.container) : $this,
				_tabs = _container.find("> div");
			_tabs.each(function() {
				_cache_div.push($(this).css("display"))
			});
			var elements = $this.find("> ul > li"),
				i = options.active - 1;
			if(!$this.data("tabslet-init")) {
				$this.data("tabslet-init", !0), $this.opts = [], $.map(["mouseevent", "activeclass", "attribute", "animation", "autorotate", "deeplinking", "pauseonhover", "delay", "container"], function(t) {
					$this.opts[t] = $this.data(t) || options[t]
				}), $this.opts.active = $this.opts.deeplinking ? deep_link() : $this.data("active") || options.active, _tabs.hide(), $this.opts.active && (_tabs.eq($this.opts.active - 1).show(), elements.eq($this.opts.active - 1).addClass(options.activeclass));
				var fn = eval(function(t, e) {
						var s = e ? elements.find("a[" + $this.opts.attribute + "=" + e + "]").parent() : $(this);
						s.trigger("_before"), elements.removeClass(options.activeclass), s.addClass(options.activeclass), _tabs.hide(), i = elements.index(s);
						var o = e || s.find("a").attr($this.opts.attribute);
						return $this.opts.deeplinking && (location.hash = o), $this.opts.animation ? _container.find(o).animate({
							opacity: "show"
						}, "slow", function() {
							s.trigger("_after")
						}) : (_container.find(o).show(), s.trigger("_after")), !1
					}),
					init = eval("elements." + $this.opts.mouseevent + "(fn)"),
					t, forward = function() {
						i = ++i % elements.length, "hover" == $this.opts.mouseevent ? elements.eq(i).trigger("mouseover") : elements.eq(i).click(), $this.opts.autorotate && (clearTimeout(t), t = setTimeout(forward, $this.opts.delay), $this.mouseover(function() {
							$this.opts.pauseonhover && clearTimeout(t)
						}))
					};
				$this.opts.autorotate && (t = setTimeout(forward, $this.opts.delay), $this.hover(function() {
					$this.opts.pauseonhover && clearTimeout(t)
				}, function() {
					t = setTimeout(forward, $this.opts.delay)
				}), $this.opts.pauseonhover && $this.on("mouseleave", function() {
					clearTimeout(t), t = setTimeout(forward, $this.opts.delay)
				}));
				var move = function(t) {
					"forward" == t && (i = ++i % elements.length), "backward" == t && (i = --i % elements.length), elements.eq(i).click()
				};
				$this.find(options.controls.next).click(function() {
					move("forward")
				}), $this.find(options.controls.prev).click(function() {
					move("backward")
				}), $this.on("show", function(t, e) {
					fn(t, e)
				}), $this.on("next", function() {
					move("forward")
				}), $this.on("prev", function() {
					move("backward")
				}), $this.on("destroy", function() {
					$(this).removeData().find("> ul li").each(function() {
						$(this).removeClass(options.activeclass)
					}), _tabs.each(function(t) {
						$(this).removeAttr("style").css("display", _cache_div[t])
					})
				})
			}
		})
	}, $(document).ready(function() {
		$('[data-toggle="tabslet"]').tabslet()
	})
}(jQuery);

















var Library = {};
Library.ease = function () {
	this.target = 0;
	this.position = 0;
	this.move = function (target, speed)
	{
		this.position += (target - this.position) * speed;
	}
}

var tv = {
	/* ==== variables ==== */
	O : [],
	screen : {},
	grid : {
		size       : 4,  // 4x4 grid
		borderSize : 6,  // borders size
		zoomed     : false
	},
	angle : {
		x : new Library.ease(),
		y : new Library.ease()
	},
	camera : {
		x    : new Library.ease(),
		y    : new Library.ease(),
		zoom : new Library.ease(),
		focalLength : 750 // camera Focal Length
	},

	/* ==== init script ==== */
	init : function ()
	{
		this.screen.obj = document.getElementById('screen');
		var img = document.getElementById('bankImages').getElementsByTagName('img');
		this.screen.obj.onselectstart = function () { return false; }
		this.screen.obj.ondrag        = function () { return false; }
		/* ==== create images grid ==== */
		var ni = 0;
		var n = (tv.grid.size / 2) - .5;
		for (var y = -n; y <= n; y++)
		{
			for (var x = -n; x <= n; x++)
			{
				/* ==== create HTML image element ==== */
				var o = document.createElement('img');
				var i = img[(ni++) % img.length];
				o.className = 'tvout';
				o.src = i.src;
				tv.screen.obj.appendChild(o);
				/* ==== 3D coordinates ==== */
				o.point3D = {
					x  : x,
					y  : y,
					z  : new Library.ease()
				};
				/* ==== push object ==== */
				o.point2D = {};
				o.ratioImage = 1;
				tv.O.push(o);
				/* ==== on mouse over event ==== */
				o.onmouseover = function ()
				{
					if (!tv.grid.zoomed)
					{
						if (tv.o)
						{
							/* ==== mouse out ==== */
							tv.o.point3D.z.target = 0;
							tv.o.className = 'tvout';
						}
						/* ==== mouse over ==== */
						this.className = 'tvover';
						this.point3D.z.target = -.5;
						tv.o = this;
					}
				}
				/* ==== on click event ==== */
				o.onclick = function ()
				{
					if (!tv.grid.zoomed)
					{
						/* ==== zoom in ==== */
						tv.camera.x.target = this.point3D.x;
						tv.camera.y.target = this.point3D.y;
						tv.camera.zoom.target = tv.screen.w * 1.25;
						tv.grid.zoomed = this;
					} else {
						if (this == tv.grid.zoomed){
							/* ==== zoom out ==== */
							tv.camera.x.target = 0;
							tv.camera.y.target = 0;
							tv.camera.zoom.target = tv.screen.w / (tv.grid.size + .1);
							tv.grid.zoomed = false;
						}
					}
				}
				/* ==== 3D transform function ==== */
				o.calc = function ()
				{
					/* ==== ease mouseover ==== */
					this.point3D.z.move(this.point3D.z.target, .5);
					/* ==== assign 3D coords ==== */
					var x = (this.point3D.x - tv.camera.x.position) * tv.camera.zoom.position;
					var y = (this.point3D.y - tv.camera.y.position) * tv.camera.zoom.position;
					var z = this.point3D.z.position * tv.camera.zoom.position;
					/* ==== perform rotations ==== */
					var xy = tv.angle.cx * y  - tv.angle.sx * z;
					var xz = tv.angle.sx * y  + tv.angle.cx * z;
					var yz = tv.angle.cy * xz - tv.angle.sy * x;
					var yx = tv.angle.sy * xz + tv.angle.cy * x;
					/* ==== 2D transformation ==== */
					this.point2D.scale = tv.camera.focalLength / (tv.camera.focalLength + yz);
					this.point2D.x = yx * this.point2D.scale;
					this.point2D.y = xy * this.point2D.scale;
					this.point2D.w = Math.round(
					                   Math.max(
					                     0,
					                     this.point2D.scale * tv.camera.zoom.position * .8
					                   )
					                 );
					/* ==== image size ratio ==== */
					if (this.ratioImage > 1)
						this.point2D.h = Math.round(this.point2D.w / this.ratioImage);
					else
					{
						this.point2D.h = this.point2D.w;
						this.point2D.w = Math.round(this.point2D.h * this.ratioImage);
					}
				}
				/* ==== rendering ==== */
				o.draw = function ()
				{
					if (this.complete)
					{
						/* ==== paranoid image load ==== */
						if (!this.loaded)
						{
							if (!this.img)
							{
								/* ==== create internal image ==== */
								this.img = new Image();
								this.img.src = this.src;
							}
							if (this.img.complete)
							{
								/* ==== get width / height ratio ==== */
								this.style.visibility = 'visible';
								this.ratioImage = this.img.width / this.img.height;
								this.loaded = true;
								this.img = false;
							}
						}
						/* ==== HTML rendering ==== */
						this.style.left = Math.round(
						                    this.point2D.x * this.point2D.scale +
						                    tv.screen.w - this.point2D.w * .5
						                  ) + 'px';
						this.style.top  = Math.round(
						                    this.point2D.y * this.point2D.scale +
						                    tv.screen.h - this.point2D.h * .5
						                  ) + 'px';
						this.style.width  = this.point2D.w + 'px';
						this.style.height = this.point2D.h + 'px';
						this.style.borderWidth = Math.round(
						                           Math.max(
						                             this.point2D.w,
						                             this.point2D.h
						                           ) * tv.grid.borderSize * .01
						                         ) + 'px';
						this.style.zIndex = Math.floor(this.point2D.scale * 100);
					}
				}
			}
		}
		/* ==== start script ==== */
		tv.resize();
		mouse.y = tv.screen.y + tv.screen.h;
		mouse.x = tv.screen.x + tv.screen.w;
		tv.run();
	},

	/* ==== resize window ==== */
	resize : function ()
	{
		var o = tv.screen.obj;
		tv.screen.w = o.offsetWidth / 2;
		tv.screen.h = o.offsetHeight / 2;
		tv.camera.zoom.target = tv.screen.w / (tv.grid.size + .1);
		for (tv.screen.x = 0, tv.screen.y = 0; o != null; o = o.offsetParent)
		{
			tv.screen.x += o.offsetLeft;
			tv.screen.y += o.offsetTop;
		}
	},

	/* ==== main loop ==== */
	run : function ()
	{
		/* ==== motion ease ==== */
		tv.angle.x.move(-(mouse.y - tv.screen.h - tv.screen.y) * .0025, .1);
		tv.angle.y.move( (mouse.x - tv.screen.w - tv.screen.x) * .0025, .1);
		tv.camera.x.move(tv.camera.x.target, tv.grid.zoomed ? .25 : .025);
		tv.camera.y.move(tv.camera.y.target, tv.grid.zoomed ? .25 : .025);
		tv.camera.zoom.move(tv.camera.zoom.target, .05);
		/* ==== angles sin and cos ==== */
		tv.angle.cx = Math.cos(tv.angle.x.position);
		tv.angle.sx = Math.sin(tv.angle.x.position);
		tv.angle.cy = Math.cos(tv.angle.y.position);
		tv.angle.sy = Math.sin(tv.angle.y.position);
		/* ==== loop through all images ==== */
		for (var i = 0, o; o = tv.O[i]; i++)
		{
			o.calc();
			o.draw();
		}
		/* ==== loop ==== */
		setTimeout(tv.run, 32);
	}
}

/* ==== global mouse position ==== */
var mouse = {
	x : 0,
	y : 0
}
document.onmousemove = function(e)
{
	if (window.event) e = window.event;
	mouse.x = e.clientX;
	mouse.y = e.clientY;
	return false;
}





$(function() {
		// 返回顶部，绑定gotop1图标
		$("#gotop1").click(function(e) {
		   TweenMax.to(window, 1.5, {scrollTo:0, ease: Expo.easeInOut});
		   var huojian = new TimelineLite();
			huojian.to("#gotop1", 1, {rotationY:720, scale:0.6, y:"+=40", ease:  Power4.easeOut})
			.to("#gotop1", 1, {y:-1000, opacity:0, ease:  Power4.easeOut}, 0.6)
			.to("#gotop1", 1, {y:0, rotationY:0, opacity:1, scale:1, ease: Expo.easeOut, clearProps: "all"}, "1.4");
		});
	});











$(document).ready(function() {
  var length = $(".content_1").children(".box").length;//盒子个数
  var boxWidth = $(".bigbox").width() / 4;//视窗宽度除以4获得移动宽度
  var virtual = length * boxWidth;	//切换的临界点
  var speed = 500;	//移动速度，速度建议要小于间隔时间的一半。
  var time =4000;	//间隔时间
  $(".box").width(boxWidth-3);

  var Item = $('#switcher'); //要移动的元素
  Item.css({ position: 'relative' }); //设置position
  var move = boxWidth + 'px'; //移动的范围，是一个box的宽度。
  var leftCriticalPoint = "-" + virtual + "px"; //有n个盒子，就以n个盒子的长度作为跳跃点

  var flag = true;//点击允许

  scrollContentStructure(length);

  function scrollContentStructure(length) {
    if(length < 4) {
      $('#switcher').width(boxWidth * (length + 4)); //视窗宽度 条状体l+4，补体6-l；假设l=3，条状体7.补体3
      if(length != 0) {
        var content_1 = $(".content_1").html();
        for(var i = 0; i < 6 - length; i++) {
          $(".content_1").append(content_1); //最少6个盒子，补够
        }
      }
    } else {
      $('#switcher').width(virtual * 2);
      $(".content_2").html($(".content_1").html()); //复制
    }
  }

  if(length != 0) {
    var callback = setInterval(moving, time);
  }

  function moving() {
    flag = false;
    if(Item[0].style.left == leftCriticalPoint) {
      Item[0].style.left = "0px";
    }
    Item.animate({ left: '-=' + move }, speed, function() {
      if(Item[0].style.left == leftCriticalPoint) {
        Item[0].style.left = "0px";
      }
    });
    flag = true;
  }

  $("li").click(function() {
    //当前处于动画状态及可点击状态判断
    //标志位防止事件栈积累，
    if(!Item.is(":animated") && flag) {
      var left = Item[0].style.left;
      clearInterval(callback);

      if($(this).index() == 1) {
        if(left == leftCriticalPoint) {
          Item[0].style.left = "0px";
        }
        Item.animate({ left: '-=' + move }, speed, function() {
          if(Item[0].style.left == leftCriticalPoint) {
            Item[0].style.left = "0px";
          }
          callback = setInterval(moving, time);
        });
        // console.log("右");
      } else if($(this).index() == 0) {
        if(isNaN(parseInt(left)) || left == "0px") {
          Item[0].style.left = leftCriticalPoint;
        }
        Item.animate({ left: '+=' + move }, speed, function() {
          if(Item[0].style.left == "0px") {
            Item[0].style.left = leftCriticalPoint;
          }
          callback = setInterval(moving, time);
        });
        // console.log("左");
      }
    }
  });

})



















function osSlider(objs) {
    var that = this; //that获得this的作用域 后面都是that 防止干扰
    that.objs = objs; //将传送来的对象赋予this
    that.pNode = $(that.objs.pNode); //pNode轮播容器对象
    that.cNodes = that.pNode.find(that.objs.cNode); //cNodes轮播子节点对象集合
    that.cNodeNums = that.cNodes.length; //预存轮播体的总数
    that.nowNodeKey = 0; //初始第一次默认显示节点为第一个
    that.width = that.cNodes.find('img').width();//得到容器的宽度
    that.height = that.cNodes.find('img').height();//得到容器的高度
    that.moveFlag = true;//添加是否可以进行下一个轮播状态
    that.isPause = false;//是否暂停状态
    that.speedNum = 0;//自动轮播的计数
    if (!that.objs.speed) {//添加默认时间
        that.objs.speed = 3000;
    }
    if (!that.objs.autoPlay) {//添加默认自动播放
        that.objs.autoPlay = true;
    }
    that.init = function() {//轮播的初始化
        that.pNode.addClass('osSlider-main');
        that.pNode.css({//轮播容器的大小控制 启用bfc模式
            'width':that.width,
            'height':that.height,
            'overflow':'hidden',
            'position':'relative'
        });
        //创建上下条切换按钮
        var $toggleBtn = $('<ul class="slider-btn"><li class="slider-btn-prev">prev</li><li class="slider-btn-next">next</li></ul>');
        $toggleBtn.appendTo(that.pNode);
        //为切换按钮绑定事件
        $(that.pNode).find('.slider-btn-prev').bind('click',function(){
            that.toggleMove('prev');
        });
        $(that.pNode).find('.slider-btn-next').bind('click',function(){
            that.toggleMove('next');
        });
        //为高亮导航创建节点
        var $navParent = $('<ul class="slider-nav"></ul>');
        $navParent.appendTo(that.pNode);
        that.cNodes.each(function(index, el) {//采用遍历，添加前后顺序
            if (index==0) {//让第一个显示在前面 同时为每个轮播体创建对应nav点
                var indexNum = 20;
                $navParent.append('<li class="active">'+(index+1)+'</li>');
            } else {
                var indexNum = index;
                $navParent.append('<li>'+(index+1)+'</li>');
            }
            $(this).css({//为每一个轮播体添加样式和顺序
                'width':that.width + 'px',
                'height':that.height + 'px',
                'overflow':'hidden',
                'position':'absolute',
                'top':'0px',
                'left':'0px',
                'z-index':indexNum
            });
        });
        //为高亮导航节点绑定事件
        $(that.pNode).find('.slider-nav li').each(function(index, el) {
            $(this).bind('click',function(){
                that.toggleMove(false,index);
            });
        });
        //判断是否自动播放
        if (that.objs.autoPlay) {
            that.moveTime();
        }
    }
    /**
     * 切换轮播后 轮播导航的高亮
     * @param {Number} tid
     */
    that.sliderNavToggle = function(tid,nid) {
        $('.slider-nav li').each(function(index, el) {
            if (index==tid||index==nid) {
                $(this).toggleClass('active');
            }
        });
    }
    /**
     * 切换效果指令函数 避免BUG
     * @param {String} command 'prev'|'next'
     * @param {Number} tid 下一个要切换的tid
     * command与tid可以缺省一个，函数自动判断
     */
    that.toggleMove = function(command,tid) {
        if (that.moveFlag) {
            if (!command) {
                if (that.nowNodeKey==tid) {
                    return;
                } else if ((that.nowNodeKey==0&&tid==that.cNodeNums-1)||tid<that.nowNodeKey) {
                    command = 'prev';
                } else {
                    command = 'next';
                }
            }
            if (!tid) {
                if(tid==0) {
                } else if (command=='prev') {
                    tid = that.nowNodeKey-1;
                    if (that.nowNodeKey==0) {
                        tid = that.cNodeNums-1;
                    }
                } else {
                    tid = that.nowNodeKey+1;
                    if (that.nowNodeKey==that.cNodeNums-1) {
                        tid = 0;
                    }
                }
            }
            /**
             * 随机函数
             */
            function random(min,max) {
                return Math.floor(Math.random()*(max+1)-min);
            }
            that.moveSwitch(random(0,6),command,tid);
        }
    }
    /**
     * 根据分配的切换指令执行效果
     * @param {Number} mid 动画指令
     * @param {String} command 'prev'|'next'
     * @param {Number} tid 下一个要切换的tid
     */
    that.moveSwitch = function(mid,command,tid) {
        nid = that.nowNodeKey;
        that.moveFlag = false;
        that.speedNum = 0;
        that.sliderNavToggle(nid,tid);
        switch (mid) {
            case 0:
                that.gridTop(tid,0);
                break;
            case 1:
                that.gridTop(tid,1);
                break;
            case 2:
                that.gridTop(tid,2);
                break;
            case 3:
                that.gridLeft(tid,0);
                break;
            case 4:
                that.gridLeft(tid,1);
                break;
            case 5:
                that.gridLeft(tid,2);
                break;
            case 6:
                that.cellToggle(tid);
                break;
            default:
                that.gridTop(tid);
                break;
        }
    }
    /**
     * 栅格上下切换
     */
    that.gridTop = function(tid,showNum) {
        that.cNodes[tid].style.zIndex = 19;//让下个节点准备好
        var $backHTML = that.cNodes[that.nowNodeKey].innerHTML;//备份当前节点的内容
        that.cNodes[that.nowNodeKey].innerHTML = '';//清空节点，方便使用
        for (var i = 0; i < 12; i++) {//利用循环 创建出栅格节点
            var $cvNode = $('<div class="cvNode"></div>');
            $(that.cNodes[that.nowNodeKey]).append($cvNode);
            $cvNode.html($backHTML);
            $cvNode.css({//为每个栅格节点添加css样式
                'position':'absolute',
                'width':that.width/12+'px',
                'height':that.height+'px',
                'zIndex':20,
                'overflow':'hidden',
                'left':that.width/12*i+'px',
                'top':'0'
            });
            $cvNode.find('*').first().css({
                'display':'block',
                'margin-left':that.width/-12*i+'px'
            });
        }

        //分配对应效果
        switch (showNum) {
            default:
            case 0:
                //添加动画过渡效果 张牙舞爪
                $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                    if (index%2==0) {
                        var topNums = that.height;
                    } else {
                        var topNums = that.height*-1;
                    }
                    $(this).animate({
                        top:topNums + 'px'
                    },1500);
                });
                setTimeout(function(){//动画结束后开始恢复原有状态
                    that.moveFlag = true;
                    that.cNodes[tid].style.zIndex = 20;
                    that.cNodes[that.nowNodeKey].style.zIndex = that.nowNodeKey;
                    $(that.cNodes[that.nowNodeKey]).html($backHTML);//清除动画产生的多余内容
                    that.nowNodeKey = tid;//得到新的当前节点key
                },1500);
                break;
            case 1:
                //兼容到下面
            case 2:
                if (showNum==1) {
                    //添加动画过渡效果 下降
                    $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                        var sp = 80*index;
                        $(this).animate({
                            top: $(this).height() + 'px'
                        },500+sp);
                    });
                } else {
                    //添加动画过渡效果 上升
                    $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                        var sp = 80*index;
                        $(this).animate({
                            top: $(this).height()*-1 + 'px'
                        },500+sp);
                    });
                }
                setTimeout(function(){//动画结束后开始恢复原有状态
                    that.moveFlag = true;
                    that.cNodes[tid].style.zIndex = 20;
                    that.cNodes[that.nowNodeKey].style.zIndex = that.nowNodeKey;
                    $(that.cNodes[that.nowNodeKey]).html($backHTML);//清除动画产生的多余内容
                    that.nowNodeKey = tid;//得到新的当前节点key
                },1380);
                break;
        }
    }

    /**
     * 栅格左右张牙舞爪切换
     */
    that.gridLeft = function(tid,showNum) {
        that.cNodes[tid].style.zIndex = 19;//让下个节点准备好
        var $backHTML = that.cNodes[that.nowNodeKey].innerHTML;//备份当前节点的内容
        that.cNodes[that.nowNodeKey].innerHTML = '';//清空节点，方便使用
        for (var i = 0;i<12;i++) {//利用循环 创建出栅格节点
            var $cvNode = $('<div class="cvNode"></div>');
            $(that.cNodes[that.nowNodeKey]).append($cvNode);
            $cvNode.html($backHTML);
            $cvNode.css({//为每个栅格节点添加css样式
                'position':'absolute',
                'width':that.width+'px',
                'height':that.height/12+'px',
                'zIndex':20,
                'overflow':'hidden',
                'left':'0',
                'top':that.height/12*i+'px',
            });
            $cvNode.find('*').first().css({
                'display':'block',
                'margin-top':that.height/-12*i+'px'
            });
        }
        switch (showNum) {
            default:
            case 0:
                //添加动画过渡效果 张牙舞爪
                $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                    if (index%2==0) {
                        var leftNums = that.width;
                    } else {
                        var leftNums = that.width*-1;
                    }
                    $(this).animate({
                        'left':leftNums + 'px'
                    },1500);
                });
                break;
            case 1:
            case 2:
                if (showNum==1) {
                    //添加动画过渡效果 向左
                    $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                        var sp = 80*index;
                        $(this).animate({
                            'left':that.width*-1 + 'px'
                        },620+sp);
                    });
                } else {
                    //添加动画过渡效果 向右
                    $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                        var sp = 80*index;
                        $(this).animate({
                            'left':that.width + 'px'
                        },620+sp);
                    });
                }
                break;
        }
        setTimeout(function(){//动画结束后开始恢复原有状态
            that.moveFlag = true;
            that.cNodes[tid].style.zIndex = 20;
            that.cNodes[that.nowNodeKey].style.zIndex = that.nowNodeKey;
            $(that.cNodes[that.nowNodeKey]).html($backHTML);//清除动画产生的多余内容
            that.nowNodeKey = tid;//得到新的当前节点key
        },1500);
    }

    //格子切换效果
    that.cellToggle = function(tid) {
        that.cNodes[tid].style.zIndex = 19;//让下个节点准备好
        var $backHTML = that.cNodes[that.nowNodeKey].innerHTML;//备份当前节点的内容
        that.cNodes[that.nowNodeKey].innerHTML = '';//清空节点，方便使用
        for (var i = 0;i<20;i++) {//利用循环 创建出栅格节点
            if (i<5) {//行数判断
                var rows = 0;
            } else if (i<10) {
                var rows = 1;
            } else if (i<15) {
                var rows = 2;
            } else {
                var rows = 3;
            }
            var $cvNode = $('<div class="cvNode"></div>');
            $(that.cNodes[that.nowNodeKey]).append($cvNode);
            $cvNode.html($backHTML);
            $cvNode.css({//为每个栅格节点添加css样式
                'position':'absolute',
                'width':that.width/5+'px',
                'height':that.height/4+'px',
                'zIndex':20,
                'overflow':'hidden',
                'left':that.width/5*(i%5)+'px',
                'top':that.height/4*rows+'px',
            });
            $cvNode.find('*').first().css({
                'display':'block',
                'margin-left':that.width/-5*(i%5)+'px',
                'margin-top':that.height/-4*rows+'px',
            });
        }
        //添加动画过渡效果
        $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
            if (index%2==0) {
                $(this).find('*').first().animate({
                    "margin-left": $(this).width() + 'px'
                }, 500);
            }
        });
        setTimeout(function(){
            $(that.cNodes[that.nowNodeKey]).find('.cvNode').each(function(index,el){
                if (index%1==0) {
                    $(this).find('*').first().animate({
                        "margin-left": $(this).width() + 'px'
                    }, 500);
                }
            });
        },600);
        setTimeout(function(){//动画结束后开始恢复原有状态
            that.moveFlag = true;
            that.cNodes[tid].style.zIndex = 20;
            that.cNodes[that.nowNodeKey].style.zIndex = that.nowNodeKey;
            $(that.cNodes[that.nowNodeKey]).html($backHTML);//清除动画产生的多余内容
            that.nowNodeKey = tid;//得到新的当前节点key
        },1100);
    }

    //自动播放控制方法
    that.moveTime = function() {
        setTimeout(function(){
            if (that.moveFlag) {
                that.speedNum++;
                if (that.speedNum>=that.objs.speed/100) {
                    that.speedNum = 0;
                    that.toggleMove('next');
                }
            }
            if (!that.isPause) {
                setTimeout(arguments.callee,100);
            }
        },100);
    }
    that.init();
}
