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
	 * Calculate center point
	 */
	ft.getCenter = function() {
		attrs = this.el.attrs;

		return {
			x: attrs.x + attrs.width  / 2,
			y: attrs.y + attrs.height / 2
			};
	}

	if ( ft.opts.rotate || ft.opts.scale ) {
		ft.handle = new Object;

		var center = ft.getCenter();

		ft.handle.line = paper
			.path('M' + center.x + ',' + center.y)
			.attr({ stroke: ft.opts.color, opacity: .2 })
			;

		ft.handle.disc = paper
			.circle(center.x, center.y, 5)
			.attr({ fill: ft.opts.color, stroke: 'none' })
			;

		ft.handle.disc.ft = ft;
	}

	/**
	 * Remove handle
	 */
	ft.unplug = function() {
		ft = this;

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
	ft.updateHandle = function() {
		var ft = this;

		if ( !ft.handle ) return;

		var center = {
			x: ft.handle.line.attrs.path[0][1],
			y: ft.handle.line.attrs.path[0][2]
			};

		var ratio = ft.el.attrs.width / ft.el.attrs.height;

		// Get the element's rotation
		var rad = ( ft.el._.deg + 90 ) * Math.PI / 180;

		var
			cx = center.x + ( ft.el.attrs.width  * ft.el._.sx * ft.opts.size ) * Math.cos(rad) / ratio,
			cy = center.y + ( ft.el.attrs.height * ft.el._.sy * ft.opts.size ) * Math.sin(rad)
			;

		ft.handle.disc.attr({
			cx: Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
			cy: Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
			});

		ft.handle.line.attr({ path: 'M' + center.x + ',' + center.y + 'L' + ft.handle.disc.attrs.cx + ',' + ft.handle.disc.attrs.cy });
	}

	if ( ft.opts.drag ) {
		el.drag(function(dx, dy) {
			var ft = this.freeTransform;

			this
				.attr({ x: dx + ft.ox, y: dy + ft.oy })
				.transform('S' + ft.el._.sx + ',' + ft.el._.sy + 'R' + ft.el._.deg)
				;

			if ( ft.handle ) {
				var center = ft.getCenter();

				ft.handle.disc.attr({ cx: dx + ft.handle.disc.ox, cy: dy + ft.handle.disc.oy });

				ft.handle.line.attr({ path: 'M' + center.x + ',' + center.y + 'L' + ft.handle.disc.attrs.cx + ',' + ft.handle.disc.attrs.cy });
			}
		}, function() {
			var ft = this.freeTransform;

			// Offset values
			ft.ox = this.attrs.x;
			ft.oy = this.attrs.y;

			if ( ft.handle ) {
				ft.handle.disc.ox = ft.handle.disc.attrs.cx;
				ft.handle.disc.oy = ft.handle.disc.attrs.cy;
			}
		});
	}

	if ( ft.handle ) {
		ft.handle.disc.drag(function(dx, dy, x, y) {
			var ft = this.ft;

			var center = ft.getCenter();

			var
				cx = dx + ft.ox,
				cy = dy + ft.oy
				;

			if ( ft.opts.rotate ) {
				var
					rad = Math.atan2(cy - center.y, cx - center.x)
					deg = rad * 180 / Math.PI - 90
					;

				// Keep line at length if scaling is disabled
				if ( !ft.opts.scale ) {
					cx = center.x + ( ft.el.attrs.height / 1.5 ) * Math.cos(rad);
					cy = center.y + ( ft.el.attrs.height / 1.5 ) * Math.sin(rad);
				}
			} else {
				var deg = ft.el._.deg;
			}

			// Keep handle within boundaries
			cx = Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x);
			cy = Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y);

			var ratio = ft.el.attrs.width / ft.el.attrs.height;

			var length = Math.sqrt(Math.pow(cx - center.x, 2) + Math.pow(cy - center.y, 2));

			if ( ft.opts.scale ) {
				var scale = {
					x: length / ( ft.el.attrs.width  * ft.opts.size ) * ratio,
					y: length / ( ft.el.attrs.height * ft.opts.size )
					};
			} else {
				var scale = {
					x: ft.el._.sx,
					y: ft.el._.sy
					};
			}

			ft.el.transform('S' + scale.x + ',' + scale.y + 'R' + deg);

			ft.updateHandle();
		}, function() {
			var ft = this.ft;

			// Offset values
			ft.ox = this.attrs.cx;
			ft.oy = this.attrs.cy;
		});
	}

	if ( ft.handle ) ft.updateHandle();

	// Enable method chaining
	return el.freeTransform;
};
