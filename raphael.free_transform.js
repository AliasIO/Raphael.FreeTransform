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
		ft.handle = {
			x: new Object,
			y: new Object
			};

		var thing = ft.getThing();

		ft.handle.x.line = paper
			.path('M' + thing.center.x + ',' + thing.center.y)
			.attr({ stroke: ft.opts.color, opacity: .2 })
			;

		ft.handle.y.line = paper
			.path('M' + thing.center.x + ',' + thing.center.y)
			.attr({ stroke: ft.opts.color, opacity: .2 })
			;

		ft.handle.x.disc = paper
			.circle(thing.center.x, thing.center.y, 5)
			.attr({ fill: ft.opts.color, stroke: 'none' })
			;

		ft.handle.y.disc = paper
			.circle(thing.center.x, thing.center.y, 5)
			.attr({ fill: ft.opts.color, stroke: 'none' })
			;

		ft.handle.x.disc.ft = ft;
		ft.handle.y.disc.ft = ft;
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

		var ratio = thing.width / thing.height;

		// Get the element's rotation
		var rad = ( thing.transform.rotate ) * Math.PI / 180;

		var
			cx = thing.center.x + ( thing.width  * thing.transform.scalex * ft.opts.size ) * Math.cos(rad) / ratio,
			cy = thing.center.y + ( thing.height * thing.transform.scaley * ft.opts.size ) * Math.sin(rad)
			;

		ft.handle.x.disc.attr({
			cx: Math.max(Math.min(cx || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
			cy: Math.max(Math.min(cy || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
			});

		ft.handle.x.line.attr({ path: 'M' + thing.center.x + ',' + thing.center.y + 'L' + ft.handle.x.disc.attrs.cx + ',' + ft.handle.x.disc.attrs.cy });

		var rad = ( thing.transform.rotate + 90 ) * Math.PI / 180;

		var
			cx = thing.center.x + ( thing.width  * thing.transform.scalex * ft.opts.size ) * Math.cos(rad) / ratio,
			cy = thing.center.y + ( thing.height * thing.transform.scaley * ft.opts.size ) * Math.sin(rad)
			;

		ft.handle.y.disc.attr({
			cx: Math.max(Math.min(cx || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
			cy: Math.max(Math.min(cy || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
			});

		ft.handle.y.line.attr({ path: 'M' + thing.center.x + ',' + thing.center.y + 'L' + ft.handle.y.disc.attrs.cx + ',' + ft.handle.y.disc.attrs.cy });
	}

	if ( ft.opts.drag ) {
		el.drag(function(dx, dy) {
			var ft = this.freeTransform;

			ft.el
				.transform('R' + ft.o.transform.rotate + 'S' + ft.o.transform.scalex + ',' + ft.o.transform.scaley + 'T' + ( dx + ft.o.translate.x ) + ',' + ( dy + ft.o.translate.y ))
				;

			if ( ft.handle ) {
				ft.handle.y.disc.attr({ cx: dx + ft.handle.y.disc.ox, cy: dy + ft.handle.y.disc.oy });

				ft.handle.y.line.attr({ path: 'M' + ( ft.o.center.x + dx ) + ',' + ( ft.o.center.y + dy ) + 'L' + ft.handle.y.disc.attrs.cx + ',' + ft.handle.y.disc.attrs.cy });
			}
		}, function() {
			var ft = this.freeTransform;

			// Offset values
			ft.o = ft.getThing();

			if ( ft.handle ) {
				ft.handle.y.disc.ox = ft.handle.y.disc.attrs.cx;
				ft.handle.y.disc.oy = ft.handle.y.disc.attrs.cy;
			}
		});
	}

	if ( ft.handle ) {
		ft.handle.y.disc.drag(function(dx, dy) {
			var ft = this.ft;

			var
				cx = dx + ft.handle.y.disc.ox,
				cy = dy + ft.handle.y.disc.oy
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

			var ratio = ft.o.width / ft.o.height;

			var length = Math.sqrt(Math.pow(cx - ft.o.center.x, 2) + Math.pow(cy - ft.o.center.y, 2));

			if ( ft.opts.scale ) {
				var scale = {
					x: ft.o.transform.scalex,//length / ( ft.o.width  * ft.opts.size ) * ratio,
					y: length / ( ft.o.height * ft.opts.size )
					};
			} else {
				var scale = {
					x: ft.o.transform.scalex,
					y: ft.o.transform.scaley
					};
			}

			ft.el.transform('R' + deg + 'S' + scale.x + ',' + scale.y + 'T' + ft.o.translate.x + ',' + ft.o.translate.y);

			ft.updateHandle();
		}, function() {
			var ft = this.ft;

			// Offset values
			ft.o = ft.getThing();

			ft.handle.y.disc.ox = this.attrs.cx;
			ft.handle.y.disc.oy = this.attrs.cy;
		});
	}

	if ( ft.handle ) ft.updateHandle();

	// Enable method chaining
	return el.freeTransform;
};
