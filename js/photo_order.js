/*jshint onevar: true, sub: true, curly: true */
/*global Handlebars: true, console: true, $: true, jQuery: true*/

imageFilenames = ["dsc_6001.jpg", "dsc_6081.jpg", "dsc_6013.jpg", "dsc_6268.jpg", "dsc_6397.jpg", "dsc_6345.jpg", "dsc_6378.jpg", "dsc_6413.jpg", "dsc_6417.jpg"];

var PO = (function() {
	var defaults = {
			dragItemSel: '.draggable'
		},
		regexp = new RegExp('dragging', 'ig');
	function isDraggable(el) {
		console.log(el.className);
		console.log('isDraggable = ', regexp.test(el.className));
		return regexp.test(el.className);
	}
	return {
		bindMouseEvents: function() {
			var that = this;
			that.draggables.on({
				mousedown: function(e) {
					e.preventDefault();
					that.startDrag(e, this);
				},
				mouseup: function(e) {
					e.preventDefault();
					console.log('mouseup');
					that.stopDrag(e, this);
				},
				mousemove: function(e) {
					console.log('dragging = ', that.dragging);
					if (that.dragging) {
						console.log('we are dragging');
						that.drag(e, this);
					}
				}
			});
		},
		findPosition: function(el, offset) {
			var pos = {
				x: 0,
				y: 0
			};
			if (el.offsetParent) {
				do {
					pos["x"] += el.offsetLeft;
					pos["y"] += el.offsetTop;
					if (offset) {
						if ($cc.getStyle(el.offsetParent, 'position') == 'relative') {
							break;
						}
					}
					el = el.offsetParent;
				} while(el);
			}
			return pos;
		},
		startDrag: function(e, el) {
			// where the mouse was clicked relative to the element
			this.click = {
				x: e.pageX - $(el).offset().left,
				y: e.pageY - $(el).offset().top
			};
			console.log(this.click);
			// original mouse position
			this.startX = e.pageX;
			this.startY = e.pageY;
			// original draggable position
			this.elStartX = $(el).offset().left;
			this.elStartY = $(el).offset().top;
			this.dragging = true;
			if (!isDraggable(el)) {
				console.log('startDrag');
				el.style.zIndex = 1000;
				el.className += ' dragging';
			}
		},
		stopDrag: function(e, el) {
			console.log('stopDrag');
			this.dragging = false;
			el.className = el.className.replace('dragging', '');
			el.style.zIndex = 1;
		},
		drag: function(e, el) {
			if (!isDraggable(el)) {
				console.log('drag for real');
				el.style.left = (e.pageX - this.click.x - this.elStartX) + 'px';
				el.style.top = (e.pageY - this.click.y - this.elStartY) + 'px';
			}
		},
		init: function(options) {
			var that = this;
			this.opts = $.extend({}, options, defaults);
			this.draggables = $(this.opts.dragItemSel);
			this.positions = [];
			this.draggables.each(function() {
				// IE7 has issues with offsetTop
				that.positions.push({
					x: this.offsetLeft,
					y: this.offsetTop
				});
			});
			this.dragging = false;
			this.bindMouseEvents();
		}
	};
})();

