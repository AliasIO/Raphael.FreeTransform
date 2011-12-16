/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

Raphael.fn.freeTransform = function(subject, options, callback) {
	// Enable method chaining
	if ( subject.freeTransform ) return subject.freeTransform;

	// Add Array.map if the browser doesn't support it
	if ( !( 'map' in Array.prototype ) ) {
		Array.prototype.map = function(callback, arg) {
			var mapped = new Array();

			for ( var i in this ) {
				if ( this.hasOwnProperty(i) ) mapped[i] = callback.call(arg, this[i], i, this);
			}

			return mapped;
		};
	}

	var paper = this;

	var bbox = subject.getBBox(true);

	var ft = subject.freeTransform = {
		axes: null,
		bbox: null,
		callback: null,
		items: new Array,
		handles: { center: null, x: null, y: null },
		opts: {
			attrs: { fill: '#000', stroke: '#000' },
			boundary: { x: paper._left ? paper._left : 0, y: paper._top  ? paper._top  : 0, width: paper.width, height: paper.height },
			drag: true,
			dragRotate: false,
			dragScale: false,
			grid: false,
			gridSnap: 0,
			keepRatio: false,
			rotate: true,
			rotateRange: [ -180, 180 ],
			rotateSnap: false,
			scale: true,
			showBBox: false,
			size: 1.2
			},
		// Keep track of transformations
		attrs: {
			x: bbox.x,
			y: bbox.y,
			size: { x: bbox.width, y: bbox.height },
			center: { x: bbox.x + bbox.width  / 2, y: bbox.y + bbox.height / 2 },
			rotate: 0,
			scale: { x: 1, y: 1 },
			translate: { x: 0, y: 0 }
		   }
		};

	/**
	 * Update handles based on the element's transformations
	 */
	ft.updateHandles = function() {
		if ( ft.handles.center ) {
			ft.handles.center.disc.attr({
				cx: Math.max(Math.min(ft.attrs.center.x + ft.attrs.translate.x || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
				cy: Math.max(Math.min(ft.attrs.center.y + ft.attrs.translate.y || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
				});
		}

		// Get the element's rotation
		var rad = {
			x: ( ft.attrs.rotate      ) * Math.PI / 180,
			y: ( ft.attrs.rotate + 90 ) * Math.PI / 180
			};

		var radius = {
			x: ft.attrs.size.x / 2 * ft.attrs.scale.x,
			y: ft.attrs.size.y / 2 * ft.attrs.scale.y
			};

		ft.axes.map(function(axis) {
			if ( ft.handles[axis] ) {
				var
					cx = ft.attrs.center.x + ft.attrs.translate.x + radius[axis] * ft.opts.size * Math.cos(rad[axis]),
					cy = ft.attrs.center.y + ft.attrs.translate.y + radius[axis] * ft.opts.size * Math.sin(rad[axis])
					;

				// Keep handle within boundaries
				ft.handles[axis].disc.attr({
					cx: Math.max(Math.min(cx || 0, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x),
					cy: Math.max(Math.min(cy || 0, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y)
					});

				ft.handles[axis].line.attr({
					path: [ [ 'M', ft.attrs.center.x + ft.attrs.translate.x, ft.attrs.center.y + ft.attrs.translate.y ], [ 'L', ft.handles[axis].disc.attrs.cx, ft.handles[axis].disc.attrs.cy ] ]
					});
			}
		});

		if ( ft.opts.showBBox || ft.opts.dragRotate ) {
			var corners = getBBox();
		}

		if ( ft.opts.showBBox ) {
			ft.bbox.attr({
				path: [
					[ 'M', corners[0].x, corners[0].y ],
					[ 'L', corners[1].x, corners[1].y ],
					[ 'L', corners[2].x, corners[2].y ],
					[ 'L', corners[3].x, corners[3].y ],
					[ 'L', corners[0].x, corners[0].y ]
					]
				});
		}

		if ( ft.opts.dragRotate ) {
			var radius = Math.max(
				Math.sqrt(Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)),
				Math.sqrt(Math.pow(corners[2].x - corners[1].x, 2) + Math.pow(corners[2].y - corners[1].y, 2))
				) / 2

			ft.circle.attr({
				cx: ft.attrs.center.x + ft.attrs.translate.x,
				cy: ft.attrs.center.y + ft.attrs.translate.y,
				r:  radius * ft.opts.size
				});
		}
	};

	// Override defaults
	ft.setOpts = function(options, callback) {
		ft.callback = typeof callback == 'function' ? callback : false;

		for ( var i in options ) ft.opts[i] = options[i];

		if ( !ft.opts.scale ) ft.opts.keepRatio = true;

		ft.axes = ft.opts.keepRatio ? [ 'y' ] : [ 'x', 'y' ];

		if ( !ft.opts.gridSnap ) ft.opts.gridSnap = ft.opts.grid;

		ft.opts.rotateRange = [
			parseInt(ft.opts.rotateRange[0]),
			parseInt(ft.opts.rotateRange[1])
			];

		addHandles();
	};

	ft.setOpts(options, callback);

	/**
	 * Clean exit
	 */
	ft.unplug = function() {
		var attrs = ft.attrs;

		removeHandles();

		// Goodbye
		delete subject.freeTransform;

		return attrs;
	};

	// Store attributes for each item
	( subject.type == 'set' ? subject.items : [ subject ] ).map(function(item) {
		ft.items.push({
			el: item,
			attrs: {
				rotate:    0,
				scale:     { x: 1, y: 1 },
				translate: { x: 0, y: 0 }
				},
			transformString: item.matrix.toTransformString()
			});
	});

	// Get the current transform values for each item
	ft.items.map(function(item, i) {
		if ( item.el._ && item.el._.transform ) {
			item.el._.transform.map(function(transform) {
				if ( transform[0] ) {
					switch ( transform[0].toUpperCase() ) {
						case 'T':
							ft.items[i].attrs.translate.x += transform[1];
							ft.items[i].attrs.translate.y += transform[2];

							break;

						case 'S':
							ft.items[i].attrs.scale.x *= transform[1];
							ft.items[i].attrs.scale.y *= transform[2];

							break;
						case 'R':
							ft.items[i].attrs.rotate += transform[1];

							break;
					}
				}
			});
		}
	});

	// If subject is not of type set, the first item _is_ the subject
	if ( subject.type != 'set' ) {
		ft.attrs.rotate    = ft.items[0].attrs.rotate;
		ft.attrs.scale     = ft.items[0].attrs.scale;
		ft.attrs.translate = ft.items[0].attrs.translate;

		ft.items[0].attrs = {
			rotate:    0,
			scale:     { x: 1, y: 1 },
			translate: { x: 0, y: 0 }
			};

		ft.items[0].transformString = '';
	}

	/**
	 * Add handles
	 */
	function addHandles() {
		removeHandles();

		if ( ft.opts.rotate || ft.opts.scale ) {
			ft.axes.map(function(axis) {
				ft.handles[axis] = new Object;

				ft.handles[axis].line = paper
					.path([ 'M', ft.attrs.center.x, ft.attrs.center.y ])
					.attr({
						stroke: ft.opts.attrs.stroke,
						'stroke-dasharray': '- ',
						opacity: .3
						})
					;

				ft.handles[axis].disc = paper
					.circle(ft.attrs.center.x, ft.attrs.center.y, 5)
					.attr(ft.opts.attrs)
					;
			});
		}

		if ( ft.opts.drag ) {
			ft.handles.center = new Object;

			ft.handles.center.disc = paper
				.circle(ft.attrs.center.x, ft.attrs.center.y, 5)
				.attr(ft.opts.attrs)
				;
		}

		if ( ft.opts.showBBox ) {
			ft.bbox = paper
				.path('')
				.attr({
					stroke: ft.opts.attrs.stroke,
					'stroke-dasharray': '- ',
					opacity: .3
					})
				;
		}

		if ( ft.opts.dragRotate || ft.opts.dragScale ) {
			ft.circle = paper
				.circle(0, 0, 0)
				.attr({
					stroke: ft.opts.attrs.stroke,
					'stroke-dasharray': '- ',
					opacity: .3
					})
				;
		}

		// Drag x, y handles
		ft.axes.map(function(axis) {
			if ( !ft.handles[axis] ) return;

			ft.handles[axis].disc.drag(function(dx, dy) {
				// viewBox might be scaled
				if ( ft.o.viewBoxRatio ) {
					dx *= ft.o.viewBoxRatio.x;
					dy *= ft.o.viewBoxRatio.y;
				}

				var
					cx = dx + ft.handles[axis].disc.ox,
					cy = dy + ft.handles[axis].disc.oy
					;

				if ( ft.opts.rotate ) {
					var rad = Math.atan2(cy - ft.o.center.y - ft.o.translate.y, cx - ft.o.center.x - ft.o.translate.x);

					ft.attrs.rotate = rad * 180 / Math.PI - ( axis == 'y' ? 90 : 0 );
				}

				// Keep handle within boundaries
				// TODO: Move to applyLimits?
				cx = Math.max(Math.min(cx, ft.opts.boundary.x + ft.opts.boundary.width),  ft.opts.boundary.x);
				cy = Math.max(Math.min(cy, ft.opts.boundary.y + ft.opts.boundary.height), ft.opts.boundary.y);

				var radius = Math.sqrt(Math.pow(cx - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(cy - ft.o.center.y - ft.o.translate.y, 2));

				if ( ft.opts.scale ) {
					ft.attrs.scale = {
						x: axis == 'x' ? radius / ( ft.o.size.x / 2 * ft.opts.size ) : ft.o.scale.x,
						y: axis == 'y' ? radius / ( ft.o.size.y / 2 * ft.opts.size ) : ft.o.scale.y
						};
				}

				applyLimits();

				if ( ft.attrs.scale.x && ft.attrs.scale.y ) {
					ft.items.map(function(item, i) {
						item.el.transform([
							'R', ft.attrs.rotate, ft.attrs.center.x, ft.attrs.center.y,
							'S', ft.attrs.scale.x, ft.attrs.scale.y, ft.attrs.center.x, ft.attrs.center.y,
							'T', ft.attrs.translate.x, ft.attrs.translate.y
							] + ft.items[i].transformString);
					});
				}

				ft.updateHandles(ft.attrs);

				asyncCallback([ ft.opts.rotate ? 'rotate' : null, ft.opts.scale ? 'scale' : null ]);
			}, function() {
				// Offset values
				ft.o = cloneObj(ft.attrs);

				if ( paper._viewBox ) {
					ft.o.viewBoxRatio = {
						x: paper._viewBox[2] / paper.width,
						y: paper._viewBox[3] / paper.height
						};
				}

				ft.handles[axis].disc.ox = this.attrs.cx;
				ft.handles[axis].disc.oy = this.attrs.cy;

				asyncCallback([ ft.opts.rotate ? 'rotate start' : null, ft.opts.scale ? 'scale start' : null ]);
			}, function() {
				asyncCallback([ ft.opts.rotate ? 'rotate end'   : null, ft.opts.scale ? 'scale end'   : null ]);
			});
		});

		// Drag element and center handle
		if ( ft.opts.drag ) {
			var draggables = new Array;

			if ( !ft.opts.dragRotate && !ft.opts.dragScale ) draggables.push(subject);

			if ( ft.handles.center ) draggables.push(ft.handles.center.disc);

			draggables.map(function(draggable) {
				draggable.drag(function(dx, dy) {
					// viewBox might be scaled
					if ( ft.o.viewBoxRatio ) {
						dx *= ft.o.viewBoxRatio.x;
						dy *= ft.o.viewBoxRatio.y;
					}

					// Snap to grid
					// TODO: Move this to applyLimits?
					var
						dist = { x: 0, y: 0 },
						snap = { x: 0, y: 0 }
						;

					if ( ft.opts.grid ) {
						dist.x = dx + ft.o.bbox.x - Math.round(( dx + ft.o.bbox.x ) / ft.opts.grid) * ft.opts.grid;
						dist.y = dy + ft.o.bbox.y - Math.round(( dy + ft.o.bbox.y ) / ft.opts.grid) * ft.opts.grid;

						if ( Math.abs(dist.x) < ft.opts.gridSnap ) snap.x = dist.x;
						if ( Math.abs(dist.y) < ft.opts.gridSnap ) snap.y = dist.y;
					}

					ft.attrs.translate.x = ft.o.translate.x + dx - snap.x;
					ft.attrs.translate.y = ft.o.translate.y + dy - snap.y;

					applyLimits();

					ft.items.map(function(item, i) {
						item.el.transform([
							'R', ft.attrs.rotate, ft.attrs.center.x, ft.attrs.center.y,
							'S', ft.attrs.scale.x, ft.attrs.scale.y, ft.attrs.center.x, ft.attrs.center.y,
							'T', ft.attrs.translate.x, ft.attrs.translate.y
							] + ft.items[i].transformString);
					});

					ft.updateHandles(ft.attrs);

					asyncCallback([ 'drag' ]);
				}, function() {
					// Offset values
					ft.o = cloneObj(ft.attrs);

					if ( ft.opts.grid ) ft.o.bbox = subject.getBBox();

					// viewBox might be scaled
					if ( paper._viewBox ) {
						ft.o.viewBoxRatio = {
							x: paper._viewBox[2] / paper.width,
							y: paper._viewBox[3] / paper.height
							};
					}

					ft.axes.map(function(axis) {
						if ( ft.handles[axis] ) {
							ft.handles[axis].disc.ox = ft.handles[axis].disc.attrs.cx;
							ft.handles[axis].disc.oy = ft.handles[axis].disc.attrs.cy;
						}
					});

					asyncCallback([ 'drag start' ]);
				}, function() {
					asyncCallback([ 'drag end'   ]);
				});
			});
		}

		if ( ft.opts.dragRotate || ft.opts.dragScale ) {
			subject.drag(function(dx, dy, x, y) {
				if ( ft.opts.dragRotate ) {
					var rad = Math.atan2(y - ft.o.center.y - ft.o.translate.y, x - ft.o.center.x - ft.o.translate.x);

					ft.attrs.rotate = ft.o.rotate + ( rad * 180 / Math.PI ) - ft.o.deg;
				}

				if ( ft.opts.dragScale ) {
					var radius = Math.sqrt(Math.pow(x - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(y - ft.o.center.y - ft.o.translate.y, 2));

					ft.attrs.scale.x = ft.attrs.scale.y = ft.o.scale.x + ( radius - ft.o.radius ) / ( ft.o.size.x / 2 );
				}

				applyLimits();

				ft.items.map(function(item, i) {
					item.el.transform([
						'R', ft.attrs.rotate, ft.attrs.center.x, ft.attrs.center.y,
						'S', ft.attrs.scale.x, ft.attrs.scale.y, ft.attrs.center.x, ft.attrs.center.y,
						'T', ft.attrs.translate.x, ft.attrs.translate.y
						] + ft.items[i].transformString);
				});

				ft.updateHandles(ft.attrs);

				asyncCallback([ ft.opts.dragRotate ? 'rotate' : null, ft.opts.dragScale ? 'scale' : null ]);
			}, function(x, y) {
				// Offset values
				ft.o = cloneObj(ft.attrs);

				ft.o.deg = Math.atan2(y - ft.o.center.y - ft.o.translate.y, x - ft.o.center.x - ft.o.translate.x) * 180 / Math.PI;

				ft.o.radius = Math.sqrt(Math.pow(x - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(y - ft.o.center.y - ft.o.translate.y, 2));

				// viewBox might be scaled
				if ( paper._viewBox ) {
					ft.o.viewBoxRatio = {
						x: paper._viewBox[2] / paper.width,
						y: paper._viewBox[3] / paper.height
						};
				}

				asyncCallback([ ft.opts.dragRotate ? 'rotate start' : null, ft.opts.dragScale ? 'scale start' : null ]);
			}, function() {
				asyncCallback([ ft.opts.dragRotate ? 'rotate end'   : null, ft.opts.dragScale ? 'scale end'   : null ]);
			});
		}

		ft.updateHandles();
	};

	/**
	 * Remove handles
	 */
	function removeHandles() {
		ft.items.map(function(item) {
			item.el.undrag();
		});

		if ( ft.handles.center ) {
			ft.handles.center.disc.remove();

			ft.handles.center = null;
		}

		[ 'x', 'y' ].map(function(axis) {
			if ( ft.handles[axis] ) {
				ft.handles[axis].disc.remove();
				ft.handles[axis].line.remove();

				ft.handles[axis] = null;
			}
		});

		if ( ft.bbox ) {
			ft.bbox.remove();

			ft.bbox = null;
		}

		if ( ft.circle ) {
			ft.circle.remove();

			ft.circle = null;
		}
	};

	/**
	 * Get rotated bounding box
	 */
	function getBBox() {
		var rad = {
			x: ( ft.attrs.rotate      ) * Math.PI / 180,
			y: ( ft.attrs.rotate + 90 ) * Math.PI / 180
			};

		var radius = {
			x: ft.attrs.size.x / 2 * ft.attrs.scale.x,
			y: ft.attrs.size.y / 2 * ft.attrs.scale.y
			};

		var
			corners = new Array,
			signs   = [ { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 } ]
			;

		signs.map(function(sign) {
			corners.push({
				x: ( ft.attrs.center.x + ft.attrs.translate.x + sign.x * radius.x * Math.cos(rad.x) ) + sign.y * radius.y * Math.cos(rad.y),
				y: ( ft.attrs.center.y + ft.attrs.translate.y + sign.x * radius.x * Math.sin(rad.x) ) + sign.y * radius.y * Math.sin(rad.y)
				});
		});

		return corners;
	}

	/**
	 * Apply limits
	 */
	function applyLimits() {
		// Maintain aspect ratio when scaling
		if ( ft.opts.keepRatio ) {
			ft.attrs.scale.x = ft.attrs.scale.y;
		}

		// Rotate with increments
		if ( ft.opts.rotateSnap ) {
			ft.attrs.rotate = Math.round(ft.attrs.rotate / ft.opts.rotateSnap) * ft.opts.rotateSnap;
		}

		// Limit range of rotation
		var deg = ( 360 + ft.attrs.rotate ) % 360;

		if ( deg > 180 ) deg = deg - 360;

		if ( ft.opts.rotateRange ) {
			if ( deg < ft.opts.rotateRange[0] ) ft.attrs.rotate += ft.opts.rotateRange[0] - deg;
			if ( deg > ft.opts.rotateRange[1] ) ft.attrs.rotate += ft.opts.rotateRange[1] - deg;
		}
	}

	/**
	 * Recursive copy of object
	 */
	function cloneObj(obj) {
		var clone = new Object;

		for ( var i in obj ) {
			clone[i] = typeof obj[i] == 'object' ? cloneObj(obj[i]) : obj[i];
		}

		return clone;
	}

	var timeout = false;

	/**
	 * Call callback asynchronously for better performance
	 */
	function asyncCallback(e) {
		if ( ft.callback ) {
			// Remove empty values
			var events = new Array();

			e.map(function(event, i) { if ( event ) events.push(event); });

			clearTimeout(timeout);

			setTimeout(function() { ft.callback(ft, events); }, 1);
		}
	}

	// Enable method chaining
	return ft;
};
