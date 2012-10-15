/*jshint onevar: true, sub: true, curly: true */
/*global Handlebars: true, console: true, $: true, jQuery: true*/

/**
 * @namespace Holds functionality for the sorting of elements on a page
 * @author Michael Turnwall
 */
var PO = (function() {
	var defaults = {
			dragArea: '#dragArea',
			dragItemSel: '.draggable'
		},
		regexp = new RegExp('dragging', 'ig');

	/**
	 * determine if an element is draggable based on its class name
	 * @param  {DOM NOde} el the element to test if its class name contains the
	 *                    selector for draggable elements.
	 * @returns {Boolean} true if the correct class name exists
	 */
	function isDraggable(el) {
		return regexp.test(el.className);
	}

	/**
	 * Determine which mouse button was clicked. We are only concerned
	 * about the left moust button
	 * @param  {Event Object} e the mouse event object
	 * @return {Boolean}   returns true if the left button was clicked
	 */
	function findMouseBtn (e) {
		var button,
			event;
		if (!e) {
			event = window.event;
		}
		if (e.button === 0 || event.which === 1) {
			return true;
		}
	}

	function checkLocalStorage () {
		try {
			localStorage.setItem('check', true);
			localStorage.removeItem('check');
			return true;
		} catch(e) {
			return false;
		}
	}

	return {

		/**
		 * bind the mouse events for the dragging
		 */
		bindMouseEvents: function() {
			var that = this;
			that.draggables.on({
				mousedown: function(e) {
					if (findMouseBtn(e)) {
						var el = this;
						e.preventDefault();
						that.index = that.placeholderIndex = that.draggables.index(this);
						that.startDrag(e, this);
						$(document).on({
							mouseup: function(e) {
								e.preventDefault();
								that.stopDrag(e, el);
							},
							mousemove: function(e) {
								if (that.dragging) {
									that.drag(e, el);
								}
							}
						});
					}
				}
			});
		},

		setItems: function() {
			var photoOrder = {
				id: []
			};
			this.draggables.each(function(i) {
				photoOrder.id.push(this.id);
			});
			localStorage.setItem('photoOrder', JSON.stringify(photoOrder));
		},

		getItems: function(key) {
			return localStorage.getItem(key);
		},

		/**
		 * place a placeholder on the page where the element will end up when the user releases the element
		 * @param  {DOM Node} el element where the placeholder is being placed next to
		 */
		insertPlaceholder: function(el) {
			var placeholder = document.createElement(el.nodeName);
			placeholder.className = el.className + ' placeholder';
			placeholder.style.height = el.offsetHeight + 'px';
			placeholder.style.width = el.offsetWidth + 'px';
			$(el).after(placeholder);
			this.placeholder = $(placeholder);
		},

		/**
		 * move the placeholder to a new location when the dragged element reaches a new location
		 * @param  {DOM Node} el the element that currently sits where the placeholder will be inserted
		 * @param  {String} insertPoint move the placeholder either "before" or "after" the element
		 */
		movePlaceholder: function(el, insertPoint) {
			if (insertPoint === 'before') {
				$('.placeholder').insertBefore(el);
			} else if (insertPoint === 'after') {
				$('.placeholder').insertAfter(el);
			}
			// this.getDraggalbePositions();
		},

		/**
		 * remove the placeholder once dragging has stopped
		 */
		removePlaceholder: function() {
			$('.placeholder').remove();
		},

		/**
		 * The user has clicked on an element. Determine if the element selected is a
		 * draggable element
		 * @param  {Event Object} e  the mouse event object
		 * @param  {DOM Node} el element the user selected to drag
		 */
		startDrag: function(e, el) {
			// original mouse position
			this.startX = e.pageX;
			this.startY = e.pageY;

			// original draggable position
			this.elStartX = $(el).position().left;
			this.elStartY = $(el).position().top;

			// turn dragging on
			this.dragging = true;
			if (!isDraggable(el)) {
				this.insertPlaceholder(el);
				el.style.top = this.elStartY + 'px';
				el.style.left = this.elStartX + 'px';
				el.className += ' dragging';
			}
		},

		/**
		 * The user has let go of the draggable object
		 * @param  {Event Object} e  the mouse event object
		 * @param  {DOM Node} el element the user selected to drag
		 */
		stopDrag: function(e, el) {
			var that = this,
				offset = this.placeholder.position();
			this.dragging = false;
			$(el).animate({
				top: offset.top,
				left: offset.left
			}, {
				duration: 250,
				complete: function() {
					that.putDragger(this);
				}
			});
			$(document).off('mousemove');
			$(document).off('mouseup');
		},

		/**
		 * Place the dragged object into its new location within the DOM
		 * @param  {DOM Node} el element that was dragged
		 */
		putDragger: function(el) {
			$(el).removeClass('dragging').insertBefore(this.placeholder);
			this.removePlaceholder();
			el.style.left = '';
			el.style.top = '';
			// reset the jQuery collection since the DOM has changed
			this.draggables = this.getDraggables();
			if (this.canStore) {
				this.setItems();
			}
		},

		/**
		 * find the beginning and end x/y coordinates for a draggable element based
		 * on the index of the PO.positions array of the x/y starting points of the
		 * draggable elements
		 * @param  {Integer} index the index of a draggable element
		 * @returns {Object Literal} the start and end x/y coordinates
		 */
		constructQuadrants: function(index) {
			return {
				xStart: this.positions[index].x,
				yStart: this.positions[index].y,
				xEnd: this.positions[index].x + this.draggables[index].offsetWidth,
				yEnd:this.positions[index].y + this.draggables[index].offsetWidth
			};
		},
		/**
		 * finds the current position of the dragged element and
		 * determines if it's over another draggable element
		 * @param  {Integer} x  current mouse x-axis coordinate
		 * @param  {Integer} y  current mouse y-axis coordinate
		 */
		findNewPos: function(x, y) {
			var i, length, insertPoint, quadrant;
			length = this.positions.length;
			
			for (i=0; i < length; i++) {
				quadrant = this.constructQuadrants(i);
				if ((x > quadrant.xStart && y > quadrant.yStart) && (x < quadrant.xEnd && y < quadrant.yEnd)) {
					if (this.placeholderIndex < i) {
						insertPoint = 'after';
					} else {
						insertPoint = 'before';
					}
					this.movePlaceholder(this.draggables[i], insertPoint);
				}
			}
		},

		/**
		 * Handles position the dragged element based on where the mouse pointer is dragged to
		 * @param  {Event Object} e  the mouse event object
		 * @param  {DOM Node} el the element that is being dragged
		 */
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

		/**
		 * use jQuery to grab all the elements that are draggable
		 * @returns {jQuery Object} jQuery collection
		 */
		getDraggables: function() {
			return $(this.opts.dragItemSel);
		},

		/**
		 * Find the x and y coordinates for each draggable element
		 * @returns {Array} positons of draggable elements
		 */
		getDraggalbePositions: function() {
			var that = this,
				offset,
				positions = [];
			this.draggables.each(function() {
				if (!this.className.match(/(dragging|placeholder)/)) {
					offset = $(this).offset();
					positions.push({
						x: offset.left,
						y: offset.top
					});
				}
			});
			return positions;
		},

		setOrder: function() {
			var order = JSON.parse(this.getItems('photoOrder')) || false,
				key,
				length,
				tempNode,
				i,
				dragArea;
			if (order) {
				dragArea = $(this.opts.dragArea);
				length = order.id.length;
				for (i=0; i<length; i++) {
					tempNode = $('#' + order.id[i]).detach();
					dragArea.append(tempNode);
				}
			}
		},

		/**
		 * initialize the PO object
		 * @param  {Object} options an object literal that can be passed into the
		 *                          constructor to override the defaults or add
		 *                          custom properties and methods
		 */
		init: function(options) {
			var that = this;
			this.opts = $.extend({}, options, defaults);
			this.canStore = checkLocalStorage();
			if (this.canStore) {
				this.setOrder();
			}
			this.draggables = this.getDraggables();
			this.positions = this.getDraggalbePositions();
			this.dragging = false;
			this.bindMouseEvents();
		}
	};
})();

