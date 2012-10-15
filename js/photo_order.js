/*jshint onevar: true, sub: true, curly: true */
/*global Handlebars: true, console: true, $: true, jQuery: true*/

imageFilenames = ["dsc_6001.jpg", "dsc_6081.jpg", "dsc_6013.jpg", "dsc_6268.jpg", "dsc_6397.jpg", "dsc_6345.jpg", "dsc_6378.jpg", "dsc_6413.jpg", "dsc_6417.jpg"];

var PO = (function() {
	var defaults = {
			dragItemSel: '.draggable'
		},
		regexp = new RegExp('dragging', 'ig');
	function isDraggable(el) {
		return regexp.test(el.className);
	}
	return {
		bindMouseEvents: function() {
			var that = this;
			that.draggables.on({
				mousedown: function(e) {
					// console.log('mousedown');
					that.index = that.placeholderIndex = that.draggables.index(this);
					e.preventDefault();
					that.startDrag(e, this);
				},
				mouseup: function(e) {
					e.preventDefault();
					// console.log('mouseup');
					that.stopDrag(e, this);
				},
				mousemove: function(e) {
					if (that.dragging) {
						that.drag(e, this);
					}
				}
			});
		},
		insertPlaceholder: function(el) {
			var placeholder = document.createElement(el.nodeName);
			placeholder.className = el.className + ' placeholder';
			placeholder.style.height = el.offsetHeight + 'px';
			placeholder.style.width = el.offsetWidth + 'px';
			$(el).after(placeholder);
			this.placeholder = $(placeholder);
		},
		movePlaceholder: function(el, insertPoint) {
			if (insertPoint === 'before') {
				$('.placeholder').insertBefore(el);
			} else if (insertPoint === 'after') {
				$('.placeholder').insertAfter(el);
			}
			// this.getDraggalbePositions();
		},
		removePlaceholder: function(el) {
			$('.placeholder').remove();
		},
		startDrag: function(e, el) {
			// where the mouse was clicked relative to the element
			this.click = {
				x: e.pageX - $(el).offset().left,
				y: e.pageY - $(el).offset().top
			};
			// console.log(this.click);
			// original mouse position
			this.startX = e.pageX;
			this.startY = e.pageY;
			// original draggable position
			this.elStartX = $(el).position().left;
			this.elStartY = $(el).position().top;
			// console.log('pageX=%d, pageY=%d, el.left=%d, el.top=%d', this.startX, this.startY, this.elStartX, this.elStartY);
			this.dragging = true;
			if (!isDraggable(el)) {
				// console.log('startDrag');
				this.insertPlaceholder(el);
				el.style.zIndex = 1000;
				el.style.position = 'absolute';
				el.style.top = this.elStartY + 'px';
				el.style.left= this.elStartX + 'px';
				el.className += ' dragging';
			}
		},
		stopDrag: function(e, el) {
			// console.log('stopDrag');
			var that = this,
				offset = this.placeholder.position();
			this.dragging = false;
			el.className = el.className.replace('dragging', '');
			$(el).animate({
				top: offset.top,
				left: offset.left
			}, {
				duration: 250,
				complete: function() {
					that.putDragger(this);
				}
			});
		},
		putDragger: function(el) {
			$(el).insertBefore(this.placeholder);
			this.removePlaceholder();
			el.style.zIndex = 1;
			el.style.position = 'relative';
			el.style.left = '';
			el.style.top = '';
			this.draggables = this.getDraggables();
			console.log(this.draggables);
		},
		findNewPos: function(x, y, el) {
			var i, length, width, height, insertPoint;
			length = this.positions.length;
			// console.log(x);
			for (i=0; i < length; i++) {
				// if (i !== this.index) {
					width = this.positions[i].x + this.draggables[i].offsetWidth;
					height = this.positions[i].y + this.draggables[i].offsetHeight;
					if ((x > this.positions[i].x && y > this.positions[i].y) && (x < width && y < height)) {
						console.log(i);
						if (this.placeholderIndex < i) {
							this.movePlaceholder(this.draggables[i], 'after');
						} else {
							this.movePlaceholder(this.draggables[i], 'before');
						}
						
						// console.log('%d mouse is past %d', x, this.positions[i].x);
					}
				// }
			}
		},
		getDraggables: function() {
			return $(this.opts.dragItemSel);
		},
		getDraggalbePositions: function() {
			var that = this,
				offset;
			this.draggables.each(function() {
				if (!this.className.match(/(dragging|placeholder)/)) {
					offset = $(this).offset();
					that.positions.push({
						x: offset.left,
						y: offset.top
					});
				}
			});
		},
		drag: function(e, el) {
			var left, top;
			if (isDraggable(el)) {
				left = (e.pageX - this.startX) + this.elStartX;
				top = (e.pageY - this.startY) + this.elStartY;
				this.findNewPos(e.pageX, e.pageY);
				el.style.left = left + 'px';
				el.style.top = top + 'px';
			}
		},
		init: function(options) {
			var that = this;
			this.opts = $.extend({}, options, defaults);
			this.draggables = this.getDraggables();
			console.log(this.draggables);
			this.positions = [];
			this.getDraggalbePositions();
			console.log(this.positions);
			this.dragging = false;
			this.bindMouseEvents();
		}
	};
})();
