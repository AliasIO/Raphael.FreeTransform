/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

Raphael.fn.freeTransform = function(el, options) {
	// Enable method chaining
	if ( el.freeTransform ) return el.freeTransform;

	var paper = this;

	var ft = el.freeTransform = {
		axes: [ 'x', 'y'],
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
			rotate: true,
			scale: true,
			size: .6
			},
		};

	// Override defaults
	for ( var i in options ) {
		el.freeTransform.opts[i] = options[i];
	}

	var foo = false;

	/**
	 * Get what we need to know about the element
	 */
	ft.getThing = function() {
		var el = this.el;

		var thing = el.getBBox(true);

		thing.translate = { x: 0, y: 0 };

		for ( var i in el._.transform ) {
			if ( el._.transform[i][0] && el._.transform[i][0].toUpperCase() == 'T' ) {
				thing.translate.x = el._.transform[i][1];
				thing.translate.y = el._.transform[i][2];

				break;
			}
		}

		thing.transform = ft.el.matrix.split();

		thing.center = {
			x: thing.x + thing.translate.x + thing.width  / 2,
			y: thing.y + thing.translate.y + thing.height / 2
			};

		if ( foo.remove ) foo.remove();
		foo = ft.el.paper.path(
			'M' +   thing.x                 + ',' +   thing.y +
			'L' + ( thing.x + thing.width ) + ',' +   thing.y +
			'L' + ( thing.x + thing.width ) + ',' + ( thing.y + thing.height ) +
			'L' +   thing.x                 + ',' + ( thing.y + thing.height ) +
			'L' +   thing.x                 + ',' +   thing.y
			)
			.translate(thing.translate.x, thing.translate.y)
			.rotate(thing.transform.rotate)
			.scale(thing.transform.scalex, thing.transform.scaley)
			;

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

		//if ( !thing ) var thing = ft.getThing();
		thing = ft.getThing();

		// Get the element's rotation
		var rad = thing.transform.rotate * Math.PI / 180;

		ft.axes.map(function(axis) {
			rad += ( axis == 'y' ? 90 : 0 ) * Math.PI / 180;

			var
				cx = thing.center.x + ( thing.width  * thing.transform.scalex * ft.opts.size ) * Math.cos(rad),
				cy = thing.center.y + ( thing.height * thing.transform.scaley * ft.opts.size ) * Math.sin(rad)
				;

			// Keep handle within boundaries
			ft.handle[axis].disc.attr({
				cx: Math.max(Math.min(cx || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
				cy: Math.max(Math.min(cy || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
				});

			ft.handle[axis].line.attr({ path: 'M' + thing.center.x + ',' + thing.center.y + 'L' + ft.handle[axis].disc.attrs.cx + ',' + ft.handle[axis].disc.attrs.cy });
		});
	}

	if ( ft.opts.drag ) {
		el.drag(function(dx, dy) {
			var ft = this.freeTransform;

			ft.el
				.transform('R' + ft.o.transform.rotate + 'S' + ft.o.transform.scalex + ',' + ft.o.transform.scaley + 'T' + ( dx + ft.o.translate.x ) + ',' + ( dy + ft.o.translate.y ))
				;

			if ( ft.handle ) {
				ft.axes.map(function(axis) {
					ft.handle[axis].disc.attr({ cx: dx + ft.handle[axis].disc.ox, cy: dy + ft.handle[axis].disc.oy });

					ft.handle[axis].line.attr({ path: 'M' + ( ft.o.center.x + dx ) + ',' + ( ft.o.center.y + dy ) + 'L' + ft.handle[axis].disc.attrs.cx + ',' + ft.handle[axis].disc.attrs.cy });
				});
			}
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

					// Keep line at length if scaling is disabled
					if ( !ft.opts.scale ) {
						cx = ft.o.center.x + ( ft.o.height / ft.opts.size ) * Math.cos(rad);
						cy = ft.o.center.y + ( ft.o.height / ft.opts.size ) * Math.sin(rad);
					}
				} else {
					var deg = ft.o.transform.rotate;
				}

				// Keep handle within boundaries
				cx = Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x);
				cy = Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y);

				var length = Math.sqrt(Math.pow(cx - ft.o.center.x, 2) + Math.pow(cy - ft.o.center.y, 2));

				if ( ft.opts.scale ) {
					var scale = {
						x: axis == 'x' ? length / ( ft.o.width  * ft.opts.size ) : ft.o.transform.scalex,
						y: axis == 'y' ? length / ( ft.o.height * ft.opts.size ) : ft.o.transform.scaley
						};
				} else {
					var scale = {
						x: ft.o.transform.scalex,
						y: ft.o.transform.scaley
						};
				}

				ft.el.transform('r' + deg + 'S' + scale.x + ',' + scale.y + 'T' + ft.o.translate.x + ',' + ft.o.translate.y);

				/* */
				/*
				var thing = ft.o;

				thing.transform.scalex = scale.x;
				thing.transform.scaley = scale.y;

				thing.transform.rotate = deg;
				*/
				/* */

				ft.updateHandle();
			}, function() {
				var ft = this.ft;

				// Offset values
				ft.o = ft.getThing();

				ft.handle[axis].disc.ox = this.attrs.cx;
				ft.handle[axis].disc.oy = this.attrs.cy;
			});
		});
	}

	if ( ft.handle ) ft.updateHandle();

	// Enable method chaining
	return el.freeTransform;
};
