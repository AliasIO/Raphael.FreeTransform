/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

Raphael.fn.freeTransform = function(el, options, callback) {
	// Enable method chaining
	if ( el.freeTransform ) return el.freeTransform;

	var paper = this;

	var ft = el.freeTransform = {
		axes: [ 'x', 'y'],
		callback: ( typeof callback == 'function' ? callback : false ),
		el: el,
		handle: false,
		opts: {
			boundary: {
				x: paper._left,
				y: paper._top,
				width: paper.width,
				height: paper.height
				},
			color: '#000',
			drag: true,
			keepRatio: false,
			rotate: true,
			scale: true,
			size: 1.2
			},
		};

	// Nothing to do here
	if ( !ft.opts.rotate && !ft.opts.scale && !ft.opts.drag ) {
		return ft;
	}

	// Override defaults
	for ( var i in options ) {
		el.freeTransform.opts[i] = options[i];
	}

	if ( !ft.opts.scale ) {
		ft.opts.keepRatio = true;
	}

	if ( ft.opts.keepRatio ) {
		ft.axes = [ 'y' ];
	}

	/**
	 * Get what we need to know about the element
	 */
	ft.getThing = function() {
		var el = this.el;

		var bbox = el.getBBox(true);

		var thing = {
			center:    { x: 0, y: 0 },
			rotate:    0,
			scale:     { x: 1, y: 1 },
			size:      { x: bbox.width, y: bbox.height },
			translate: { x: 0, y: 0 },
			x:         bbox.x,
			y:         bbox.y,
			};

		for ( var i in el._.transform ) {
			if ( el._.transform[i][0] ) {
				switch ( el._.transform[i][0].toUpperCase() ) {
					case 'T':
						thing.translate.x = el._.transform[i][1];
						thing.translate.y = el._.transform[i][2];

						break;
					case 'S':
						thing.scale.x = el._.transform[i][1];
						thing.scale.y = el._.transform[i][2];

						break;
					case 'R':
						thing.rotate = el._.transform[i][1];

						break;
				}
			}
		}

		thing.center.x = thing.x + thing.translate.x + thing.size.x / 2;
		thing.center.y = thing.y + thing.translate.y + thing.size.y / 2;

		return thing;
	}

	if ( ft.opts.rotate || ft.opts.scale ) {
		ft.handle = {
			x: new Object,
			y: new Object
			};

		var thing = ft.getThing();

		ft.axes.map(function(axis) {
			ft.handle[axis].disc = paper
				.circle(thing.center.x, thing.center.y, 5)
				.attr({ fill: ft.opts.color, stroke: 'none' })
				;

			ft.handle[axis].line = paper
				.path('M' + thing.center.x + ',' + thing.center.y)
				.attr({ stroke: ft.opts.color, opacity: .2 })
				;

			ft.handle[axis].disc.ft = ft;
		});
	}

	/**
	 * Remove handle
	 */
	ft.unplug = function() {
		var ft = this;

		if ( ft.handle ) {
			ft.handle.x.disc.remove();
			ft.handle.y.disc.remove();

			ft.handle.x.line.remove();
			ft.handle.y.line.remove();
		}

		if ( ft.opts.drag ) ft.el.undrag();

		// Goodbye
		delete ft.el.freeTransform;
	};

	/**
	 * Draw handle based on the elements attributes
	 */
	ft.updateHandle = function(thing) {
		var ft = this;

		if ( !ft.handle ) return;

		if ( !thing ) var thing = ft.getThing();

		// Get the element's rotation
		var rad = thing.rotate * Math.PI / 180;

		ft.axes.map(function(axis) {
			rad += ( axis == 'y' ? 90 : 0 ) * Math.PI / 180;

			var
				cx = thing.center.x + ( thing.size[axis] / 2 * thing.scale[axis] * ft.opts.size ) * Math.cos(rad),
				cy = thing.center.y + ( thing.size[axis] / 2 * thing.scale[axis] * ft.opts.size ) * Math.sin(rad)
				;

			// Keep handle within boundaries
			ft.handle[axis].disc.attr({
				cx: Math.max(Math.min(cx || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
				cy: Math.max(Math.min(cy || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
				});

			ft.handle[axis].line.attr({ path: 'M' + thing.center.x + ',' + thing.center.y + 'L' + ft.handle[axis].disc.attrs.cx + ',' + ft.handle[axis].disc.attrs.cy });
		});

		if ( ft.callback ) ft.callback(thing);
	}

	if ( ft.opts.drag ) {
		el.drag(function(dx, dy) {
			var ft = this.freeTransform;

			ft.el
				.transform('R' + ft.o.rotate + 'S' + ft.o.scale.x + ',' + ft.o.scale.y + 'T' + ( dx + ft.o.translate.x ) + ',' + ( dy + ft.o.translate.y ))
				;

			if ( ft.handle ) {
				ft.axes.map(function(axis) {
					ft.handle[axis].disc.attr({ cx: dx + ft.handle[axis].disc.ox, cy: dy + ft.handle[axis].disc.oy });

					ft.handle[axis].line.attr({ path: 'M' + ( ft.o.center.x + dx ) + ',' + ( ft.o.center.y + dy ) + 'L' + ft.handle[axis].disc.attrs.cx + ',' + ft.handle[axis].disc.attrs.cy });
				});
			}

			var thing = cloneObj(ft.o);

			thing.translate.x += dx;
			thing.translate.y += dy;

			if ( ft.callback ) ft.callback(thing);
		}, function() {
			var ft = this.freeTransform;

			// Offset values
			ft.o = ft.getThing();

			if ( ft.handle ) {
				ft.axes.map(function(axis) {
					ft.handle[axis].disc.ox = ft.handle[axis].disc.attrs.cx;
					ft.handle[axis].disc.oy = ft.handle[axis].disc.attrs.cy;
				});
			}
		});
	}

	if ( ft.handle ) {
		ft.axes.map(function(axis) {
			ft.handle[axis].disc.drag(function(dx, dy) {
				var ft = this.ft;

				var
					cx = dx + ft.handle[axis].disc.ox,
					cy = dy + ft.handle[axis].disc.oy
					;

				if ( ft.opts.rotate ) {
					var
						rad = Math.atan2(cy - ft.o.center.y, cx - ft.o.center.x),
						deg = rad * 180 / Math.PI - ( axis == 'y' ? 90 : 0 )
						;
				} else {
					var deg = ft.o.rotate;
				}

				// Keep handle within boundaries
				cx = Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x);
				cy = Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y);

				var length = Math.sqrt(Math.pow(cx - ft.o.center.x, 2) + Math.pow(cy - ft.o.center.y, 2));

				if ( ft.opts.scale ) {
					var scale = {
						x: axis == 'x' ? length / ( ft.o.size.x / 2 * ft.opts.size ) : ft.o.scale.x,
						y: axis == 'y' ? length / ( ft.o.size.y / 2 * ft.opts.size ) : ft.o.scale.y
						};

					if ( ft.opts.keepRatio ) {
						scale.x = scale.y;
					}
				} else {
					var scale = {
						x: ft.o.scale.x,
						y: ft.o.scale.y
						};
				}

				if ( scale.x && scale.y ) {
					ft.el.transform('R' + deg + 'S' + scale.x + ',' + scale.y + 'T' + ft.o.translate.x + ',' + ft.o.translate.y);
				}

				var thing = cloneObj(ft.o);

				thing.scale.x = scale.x;
				thing.scale.y = scale.y;

				thing.rotate = deg;

				ft.updateHandle(thing);
			}, function() {
				var ft = this.ft;

				// Offset values
				ft.o = ft.getThing();

				ft.handle[axis].disc.ox = this.attrs.cx;
				ft.handle[axis].disc.oy = this.attrs.cy;
			});
		});
	}

	// Recursive copy of object
	function cloneObj(obj) {
		var clone = new Object;

		for ( var i in obj ) {
			clone[i] = typeof obj[i] == 'object' ? cloneObj(obj[i]) : obj[i];
		}

		return clone;
	}

	if ( ft.handle ) ft.updateHandle();

	// Enable method chaining
	return ft;
};
