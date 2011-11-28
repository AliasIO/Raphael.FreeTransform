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

	/**
	 * Get what we need to know about the element
	 */
	ft.getThing = function() {
		var el = this.el;

		var thing = el.getBBox(true);

		thing.translate = { x: 0, y: 0 };

		for ( var i in el._.transform ) {
			if ( el._.transform[i][0] == 't' || el._.transform[i][0] == 'T' ) {
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

		return thing;
	}

	if ( ft.opts.rotate || ft.opts.scale ) {
		ft.handle = new Object;

		var thing = ft.getThing();

		ft.handle.line = paper
			.path('M' + thing.center.x + ',' + thing.center.y)
			.attr({ stroke: ft.opts.color, opacity: .2 })
			;

		ft.handle.disc = paper
			.circle(thing.center.x, thing.center.y, 5)
			.attr({ fill: ft.opts.color, stroke: 'none' })
			;

		ft.handle.disc.ft = ft;
	}

	/**
	 * Remove handle
	 */
	ft.unplug = function() {
		var ft = this;

		if ( ft.handle ) {
			ft.handle.disc.remove();
			ft.handle.line.remove();
		}

		if ( ft.opts.drag ) ft.el.undrag();

		// Goodbye
		delete this;
	};

	/**
	 * Draw handle based on the elements attributes
	 */
	ft.updateHandle = function(thing) {
		var ft = this;

		if ( !ft.handle ) return;

		if ( !thing ) var thing = ft.getThing();

		var ratio = thing.width / thing.height;

		// Get the element's rotation
		var rad = ( thing.transform.rotate + 90 ) * Math.PI / 180;

		var
			cx = thing.center.x + ( thing.width  * thing.transform.scalex * ft.opts.size ) * Math.cos(rad) / ratio,
			cy = thing.center.y + ( thing.height * thing.transform.scaley * ft.opts.size ) * Math.sin(rad)
			;

		ft.handle.disc.attr({
			cx: Math.max(Math.min(cx || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
			cy: Math.max(Math.min(cy || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
			});

		ft.handle.line.attr({ path: 'M' + thing.center.x + ',' + thing.center.y + 'L' + ft.handle.disc.attrs.cx + ',' + ft.handle.disc.attrs.cy });
	}

	if ( ft.opts.drag ) {
		el.drag(function(dx, dy) {
			var ft = this.freeTransform;

			ft.el
				.transform('S' + ft.o.transform.scalex + ',' + ft.o.transform.scaley + 'R' + ft.o.transform.rotate + 'T' + ( dx + ft.o.translate.x ) + ',' + ( dy + ft.o.translate.y ))
				;

			if ( ft.handle ) {
				ft.handle.disc.attr({ cx: dx + ft.handle.disc.ox, cy: dy + ft.handle.disc.oy });

				ft.handle.line.attr({ path: 'M' + ( ft.o.center.x + dx ) + ',' + ( ft.o.center.y + dy ) + 'L' + ft.handle.disc.attrs.cx + ',' + ft.handle.disc.attrs.cy });
			}
		}, function() {
			var ft = this.freeTransform;

			// Offset values
			ft.o = ft.getThing();

			if ( ft.handle ) {
				ft.handle.disc.ox = ft.handle.disc.attrs.cx;
				ft.handle.disc.oy = ft.handle.disc.attrs.cy;
			}
		});
	}

	if ( ft.handle ) {
		ft.handle.disc.drag(function(dx, dy) {
			var ft = this.ft;

			var
				cx = dx + ft.handle.disc.ox,
				cy = dy + ft.handle.disc.oy
				;

			if ( ft.opts.rotate ) {
				var
					rad = Math.atan2(cy - ft.o.center.y, cx - ft.o.center.x)
					deg = rad * 180 / Math.PI - 90
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
					x: length / ( ft.o.width  * ft.opts.size ),
					y: length / ( ft.o.height * ft.opts.size )
					};
			} else {
				var scale = {
					x: ft.o.transform.scalex,
					y: ft.o.transform.scaley
					};
			}

			ft.el.transform('S' + scale.x + ',' + scale.y + 'R' + deg + 'T' + ft.o.translate.x + ',' + ft.o.translate.y);

			ft.updateHandle();
		}, function() {
			var ft = this.ft;

			// Offset values
			ft.o = ft.getThing();

			ft.handle.disc.ox = this.attrs.cx;
			ft.handle.disc.oy = this.attrs.cy;
		});
	}

	if ( ft.handle ) ft.updateHandle();

	// Enable method chaining
	return el.freeTransform;
};
