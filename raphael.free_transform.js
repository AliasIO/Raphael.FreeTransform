/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

Raphael.fn.freeTransform = function(el, x, y, width, height) {
	var paper = this;

	var center = {
		x: el.attrs.x + el.attrs.width  / 2,
		y: el.attrs.y + el.attrs.height / 2
		};

	var disc = paper
		.circle(center.x, center.y + el.attrs.height / 1.5, 5)
		.attr({ fill: 'black', stroke: 'none' })
		;

	var line = paper
		.path('M' + center.x + ',' + center.y + 'L' + disc.attrs.cx + ',' + disc.attrs.cy)
		.attr({ stroke: disc.attrs.fill, opacity: .2 })
		;

	if ( typeof x      == 'undefined' ) x      = paper._left;
	if ( typeof y      == 'undefined' ) y      = paper._top;
	if ( typeof width  == 'undefined' ) width  = paper.width;
	if ( typeof height == 'undefined' ) height = paper.height;

	el.freeTransform = {
		disc:     disc,
		line:     line,
		scale:    1,
		rotation: 0,
		minX:     x,
		minY:     y,
		maxX:     x + width,
		maxY:     y + height
		};

	disc.el = el;

	el.drag(function(dx, dy) {
		var ft = this.freeTransform;

		this.attr({ x: dx + ft.ox, y: dy + ft.oy });

		this.transform('S' + ft.scale + 'R' + ft.rotation);

		var center = {
			x: this.attrs.x + this.attrs.width  / 2,
			y: this.attrs.y + this.attrs.height / 2
			};

		ft.disc.attr({ cx: dx + ft.disc.ox, cy: dy + ft.disc.oy });

		ft.line.attr({ path: 'M' + center.x + ',' + center.y + 'L' + ft.disc.attrs.cx + ',' + ft.disc.attrs.cy });
	}, function() {
		var ft = this.freeTransform;

		ft.ox = this.attrs.x;
		ft.oy = this.attrs.y;

		ft.disc.ox = ft.disc.attrs.cx;
		ft.disc.oy = ft.disc.attrs.cy;
	});

	disc.drag(function(dx, dy, x, y) {
		var ft = this.el.freeTransform;

		var center = {
			x: ft.line.attrs.path[0][1],
			y: ft.line.attrs.path[0][2]
			};

		this.attr({ cx: Math.max(Math.min(dx + ft.ox, ft.maxX), ft.minX), cy: Math.max(Math.min(dy + ft.oy, ft.maxY), ft.minY) });

		ft.line.attr({ path: 'M' + center.x + ',' + center.y + 'L' + this.attrs.cx + ',' + this.attrs.cy });

		ft.scale = ft.line.getTotalLength() / ( this.el.attrs.height / 1.5 );

		ft.rotation = Math.atan2(this.attrs.cy - center.y, this.attrs.cx - center.x) * 180 / Math.PI - 90;

		this.el.transform('S' + ft.scale + 'R' + ft.rotation);
	}, function() {
		var ft = this.el.freeTransform;

		ft.ox = this.attrs.cx;
		ft.oy = this.attrs.cy;
	});
};
