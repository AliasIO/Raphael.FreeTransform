/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

Raphael.fn.freeTransform = function(el, options) {
	if ( el.freeTransform ) {
		return el.freeTransform;
	}

	var paper = this;

	var ft = el.freeTransform = {
		el: el,
		opts: {
			boundary: {
				x: paper._left,
				y: paper._top,
				width: paper.width,
				height: paper.height
				},
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

	var center = {
		x: el.attrs.x + el.attrs.width  / 2,
		y: el.attrs.y + el.attrs.height / 2
		};

	 ft.disc = paper
		.circle(center.x, center.y + el.attrs.height * ft.opts.size, 5)
		.attr({ fill: 'black', stroke: 'none' })
		;

	ft.disc.ft = ft;

	ft.line = paper
		.path('M' + center.x + ',' + center.y + 'L' + ft.disc.attrs.cx + ',' + ft.disc.attrs.cy)
		.attr({ stroke: ft.disc.attrs.fill, opacity: .2 })
		;

	/**
	 * Remove handle
	 */
	ft.unplug = function() {
		this.disc.remove();
		this.line.remove();

		this.el.undrag();

		delete this.el.freeTransform;
	};

	/**
	 * Draw handle based on the elements attributes
	 */
	ft.updateHandle = function() {
		var ft = this;

		var center = {
			x: ft.line.attrs.path[0][1],
			y: ft.line.attrs.path[0][2]
			};

		// Get the element's rotation
		var rad = ( ft.el._.deg + 90 ) * Math.PI / 180;

		var
			cx = center.x + ( ft.el.attrs.width  * ft.el._.sx * ft.opts.size ) * Math.cos(rad),
			cy = center.y + ( ft.el.attrs.height * ft.el._.sy * ft.opts.size ) * Math.sin(rad)
			;

		ft.disc.attr({
			cx: Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
			cy: Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
			});

		ft.line.attr({ path: 'M' + center.x + ',' + center.y + 'L' + ft.disc.attrs.cx + ',' + ft.disc.attrs.cy });
	}

	if ( ft.opts.drag ) {
		el.drag(function(dx, dy) {
			var ft = this.freeTransform;

			this
				.attr({ x: dx + ft.ox, y: dy + ft.oy })
				.transform('S' + ft.el._.sx + ',' + ft.el._.sy + 'R' + ft.el._.deg)
				;

			var center = {
				x: this.attrs.x + this.attrs.width  / 2,
				y: this.attrs.y + this.attrs.height / 2
				};

			ft.disc.attr({ cx: dx + ft.disc.ox, cy: dy + ft.disc.oy });

			ft.line.attr({ path: 'M' + center.x + ',' + center.y + 'L' + ft.disc.attrs.cx + ',' + ft.disc.attrs.cy });
		}, function() {
			var ft = this.freeTransform;

			// Offset values
			ft.ox = this.attrs.x;
			ft.oy = this.attrs.y;

			ft.disc.ox = ft.disc.attrs.cx;
			ft.disc.oy = ft.disc.attrs.cy;
		});
	}

	ft.disc.drag(function(dx, dy, x, y) {
		var ft = this.ft;

		var center = {
			x: ft.line.attrs.path[0][1],
			y: ft.line.attrs.path[0][2]
			};

		var
			cx = dx + ft.ox,
			cy = dy + ft.oy
			;

		var
			rad = Math.atan2(cy - center.y, cx - center.x)
			deg = rad * 180 / Math.PI
			;

		// Keep line at length if scaling is disabled
		if ( !ft.opts.scale && ft.opts.rotate ) {
			cx = center.x + ( ft.el.attrs.height / 1.5 ) * Math.cos(rad);
			cy = center.y + ( ft.el.attrs.height / 1.5 ) * Math.sin(rad);
		}

		// Keep handle within boundaries
		cx = Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x);
		cy = Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y);

		var length = Math.sqrt(Math.pow(cx - center.x, 2) + Math.pow(cy - center.y, 2));

		if ( ft.opts.scale ) {
			var scale = {
				x: length / ( ft.el.attrs.width  * ft.opts.size ),
				y: length / ( ft.el.attrs.height * ft.opts.size )
				};
		} else {
			var scale = {
				x: ft.el._.sx,
				y: ft.el._.sy
				};
		}

		ft.el.transform('S' + scale.x + ',' + scale.y + 'R' + ( deg - 90 ));

		ft.updateHandle();
	}, function() {
		var ft = this.ft;

		// Offset values
		ft.ox = this.attrs.cx;
		ft.oy = this.attrs.cy;
	});

	return el.freeTransform;
};
