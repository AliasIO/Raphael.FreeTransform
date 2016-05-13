/*
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
(function (root, factory) {
	if ( typeof define === 'function' && define.amd ) {
		// AMD. Register as an anonymous module.
		define(['raphael'], function(Raphael) {
			// Use global variables if the locals are undefined.
			return factory(Raphael || root.Raphael);
		});
	} else {
		// RequireJS isn't being used. Assume underscore and backbone are loaded in <script> tags
		factory(Raphael);
	}
}(this, function(Raphael) {
	Raphael.fn.freeTransform = function(subject, options, callback) {
		var
			ft, i, mapped, timeout,
			paper = this,
			bbox  = subject.getBBox(true);


		// Enable method chaining
		if ( subject.freeTransform ) {
			return subject.freeTransform;
		}

		// Add Array.map if the browser doesn't support it
		if ( !Array.prototype.hasOwnProperty('map') ) {
			Array.prototype.map = function(callback, arg) {
				mapped = [];

				for ( i in this ) {
					if ( this.hasOwnProperty(i) ) {
						mapped[i] = callback.call(arg, this[i], i, this);
					}
				}

				return mapped;
			};
		}

		// Add Array.indexOf if not builtin
		if ( !Array.prototype.hasOwnProperty('indexOf') ) {
			Array.prototype.indexOf = function(obj, start) {
				for ( i = ( start || 0 ), j = this.length; i < j; i++ ) {
					if ( this[i] === obj ) {
						return i;
					}
				}

				return -1;
			};
		}

		ft = subject.freeTransform = {
			// Keep track of transformations
			attrs: {
				x: bbox.x,
				y: bbox.y,
				size: { x: bbox.width, y: bbox.height },
				center: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 },
				rotate: 0,
				scale: { x: 1, y: 1 },
				translate: { x: 0, y: 0 },
				ratio: 1
			},
			axes: null,
			bbox: null,
			callback: null,
			items: [],
			handles: { center: null, x: null, y: null },
			offset: {
				rotate: 0,
				scale: { x: 1, y: 1 },
				translate: { x: 0, y: 0 }
			},
			opts: {
				animate: false,
				attrs: { fill: '#fff', stroke: '#000' },
				boundary: { x: paper._left || 0, y: paper._top || 0, width: null, height: null },
				customCorners: false, // { size: <number>, distance: <number>, corners: [ action: <string>, image: <string> ]	}
				distance: 1.3,
				drag: true,
				draw: false,
				keepRatio: false,
				range: { rotate: [ -180, 180 ], scale: [ -99999, 99999 ] },
				rotate: true,
				scale: true,
				snap: { rotate: 0, scale: 0, drag: 0 },
				snapDist: { rotate: 0, scale: 0, drag: 7 },
				size: 5
			},
			subject: subject
		};

		/**
		 * Update handles based on the element's transformations
		 */
		ft.updateHandles = function() {
			var
				corners, cornersDistance, rad, radius, cx, cy, viewBoxRatio,
				bboxHandleDirection = [ // Allowed x, y scaling directions for bbox handles
					[ -1, -1 ], [ 1, -1 ], [ 1, 1 ], [ -1, 1 ],
					[  0, -1 ], [ 1,  0 ], [ 0, 1 ], [ -1, 0 ]
				];

			if ( ft.handles.bbox || ft.opts.rotate.indexOf('self') >= 0 ) {
				cornersDistance = corners = getBBox(0);

				if ( ft.opts.customCorners && typeof ft.opts.customCorners.distance === 'number' ) {
					cornersDistance = getBBox(ft.opts.customCorners.distance);
				}
			}

			// Get the element's rotation
			rad = {
				x: ( ft.attrs.rotate      ) * Math.PI / 180,
				y: ( ft.attrs.rotate + 90 ) * Math.PI / 180
			};

			radius = {
				x: ft.attrs.size.x / 2 * ft.attrs.scale.x,
				y: ft.attrs.size.y / 2 * ft.attrs.scale.y
			};

			ft.axes.map(function(axis) {
				if ( ft.handles[axis] ) {
					cx           = ft.attrs.center.x + ft.attrs.translate.x + radius[axis] * ft.opts.distance * Math.cos(rad[axis]),
					cy           = ft.attrs.center.y + ft.attrs.translate.y + radius[axis] * ft.opts.distance * Math.sin(rad[axis]),
					viewBoxRatio = { x: 1, y: 1 };

					// viewBox might be scaled
					if ( paper._viewBox ) {
						viewBoxRatio = {
							x: paper._viewBox[2] / getPaperSize().x,
							y: paper._viewBox[3] / getPaperSize().y
						};
					}

					// Keep handle within boundaries
					if ( ft.opts.boundary ) {
						cx = Math.max(Math.min(cx, ft.opts.boundary.x + ( ft.opts.boundary.width  || getPaperSize().x * viewBoxRatio.x)), ft.opts.boundary.x);
						cy = Math.max(Math.min(cy, ft.opts.boundary.y + ( ft.opts.boundary.height || getPaperSize().y * viewBoxRatio.y)), ft.opts.boundary.y);
					}

					ft.handles[axis].disc.attr({ cx: cx, cy: cy });

					ft.handles[axis].line.toFront().attr({
						path: [ [ 'M', ft.attrs.center.x + ft.attrs.translate.x, ft.attrs.center.y + ft.attrs.translate.y ], [ 'L', ft.handles[axis].disc.attrs.cx, ft.handles[axis].disc.attrs.cy ] ]
					});

					ft.handles[axis].disc.toFront();
				}
			});

			if ( ft.bbox ) {
				ft.bbox.toFront().attr({
					path: [
						[ 'M', corners[0].x, corners[0].y ],
						[ 'L', corners[1].x, corners[1].y ],
						[ 'L', corners[2].x, corners[2].y ],
						[ 'L', corners[3].x, corners[3].y ],
						[ 'L', corners[0].x, corners[0].y ]
					]
				});

				if ( ft.handles.bbox ) {
					ft.handles.bbox.map(function (handle, i) {
						var cx, cy, j, k;

						if ( handle.isCorner ) {
							cx = cornersDistance[i].x;
							cy = cornersDistance[i].y;
						} else {
							j  = i % 4;
							k  = ( j + 1 ) % corners.length;
							cx = ( cornersDistance[j].x + cornersDistance[k].x ) / 2;
							cy = ( cornersDistance[j].y + cornersDistance[k].y ) / 2;
						}

						handle.element.toFront()
							.attr({
								x: cx - ( handle.isCorner ? ( ft.opts.customCorners ? Math.ceil(ft.opts.customCorners.size / 2) : ft.opts.size.bboxCorners ) : ft.opts.size.bboxSides ),
								y: cy - ( handle.isCorner ? ( ft.opts.customCorners ? Math.ceil(ft.opts.customCorners.size / 2) : ft.opts.size.bboxCorners ) : ft.opts.size.bboxSides )
							})
							.transform(ft.opts.customCorners ? null : 'R' + ft.attrs.rotate);

						handle.x = bboxHandleDirection[i][0];
						handle.y = bboxHandleDirection[i][1];
					});
				}
			}

			if ( ft.circle ) {
				ft.circle.attr({
					cx: ft.attrs.center.x + ft.attrs.translate.x,
					cy: ft.attrs.center.y + ft.attrs.translate.y,
					r:  Math.max(radius.x, radius.y) * ft.opts.distance
				});
			}

			if ( ft.handles.center ) {
				ft.handles.center.disc.toFront().attr({
					cx: ft.attrs.center.x + ft.attrs.translate.x,
					cy: ft.attrs.center.y + ft.attrs.translate.y
				});
			}

			if ( ft.opts.rotate.indexOf('self') >= 0 ) {
				radius = Math.max(
					Math.sqrt(Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2)),
					Math.sqrt(Math.pow(corners[2].x - corners[1].x, 2) + Math.pow(corners[2].y - corners[1].y, 2))
				) / 2;
			}

			return ft;
		};

		/**
		 * Add handles
		 */
		ft.showHandles = function() {
			var
				i, handle, rotate, scale,
				handles    = [];
				draggables = [];

			ft.hideHandles();

			ft.axes.map(function(axis) {
				ft.handles[axis] = {};

				ft.handles[axis].line = paper
					.path([ 'M', ft.attrs.center.x, ft.attrs.center.y ])
					.attr({
						stroke: ft.opts.attrs.stroke,
						'stroke-dasharray': '- ',
						opacity: .5
					});

				ft.handles[axis].disc = paper
					.circle(ft.attrs.center.x, ft.attrs.center.y, ft.opts.size.axes)
					.attr(ft.opts.attrs);

				ft.handles[axis].disc.node.setAttribute('class', 'handle arm axis-' + axis);
			});

			if ( ft.opts.draw.indexOf('bbox') >= 0 ) {
				ft.bbox = paper
					.path('')
					.attr({
						stroke: ft.opts.attrs.stroke,
						'stroke-dasharray': '- ',
						opacity: .5
					});

				ft.handles.bbox = [];

				for ( i = ( ft.opts.scale.indexOf('bboxCorners') || ft.opts.customCorners >= 0 ? 0 : 4 ); i < ( ft.opts.scale.indexOf('bboxSides') === -1 ? 4 : 8 ); i ++ ) {
					handle = {};

					handle.index    = i;
					handle.axis     = i % 2 ? 'x' : 'y';
					handle.isCorner = i < 4;

					if ( handle.isCorner && ft.opts.customCorners ) {
						handle.element = paper
							.image(ft.opts.customCorners.corners[i].image, ft.attrs.center.x, ft.attrs.center.y, ft.opts.customCorners.size, ft.opts.customCorners.size);
					} else {
						handle.element = paper
							.rect(ft.attrs.center.x, ft.attrs.center.y, ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides' ] * 2, ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides' ] * 2)
							.attr(ft.opts.attrs);

						if ( handle.isCorner ) {
							handle.element.node.setAttribute('class', 'handle bbox corner index-' + i + ' axis-' + handle.axis);
						} else {
							handle.element.node.setAttribute('class', 'handle bbox side index-' + ( i - 4 ) + ' axis-' + handle.axis);
						}
					}

					ft.handles.bbox[i] = handle;
				}
			}

			if ( ft.opts.draw.indexOf('circle') !== -1 ) {
				ft.circle = paper
					.circle(0, 0, 0)
					.attr({
						stroke: ft.opts.attrs.stroke,
						'stroke-dasharray': '- ',
						opacity: .3
					});
			}

			if ( ft.opts.drag.indexOf('center') !== -1 ) {
				ft.handles.center = {};

				ft.handles.center.disc = paper
					.circle(ft.attrs.center.x, ft.attrs.center.y, ft.opts.size.center)
					.attr(ft.opts.attrs);

				ft.handles.center.disc.node.setAttribute('class', 'handle center');
			}

			// Drag x, y handles and custom corners
			ft.axes.map(function(axis) {
				if ( ft.handles[axis] ) {
					handles.push({
						element:  ft.handles[axis].disc,
						rotate:   ft.opts.rotate.indexOf('axis' + axis.toUpperCase()) !== -1,
						scale:    ft.opts.scale .indexOf('axis' + axis.toUpperCase()) !== -1,
						axis:     axis,
						isCorner: false
					});
				}
			});

			if ( ft.opts.customCorners ) {
				ft.handles.bbox.map(function(handle) {
					var action;

					if ( typeof ft.opts.customCorners.corners[handle.index] !== 'undefined' ) {
						action = ft.opts.customCorners.corners[handle.index].action;

						if ( action === 'rotate' || action === 'scale' ) {
							handles.push({
								element:  handle.element,
								rotate:   action === 'rotate',
								scale:    action === 'scale',
								axis:     'x',
								isCorner: true
							});
						}
					}
				});
			}

			handles.map(function(handle) {
				handle.element.drag(function(dx, dy) {
					var
						cx, cy, rad, opposite, adjacent, hypotenuse, pos,
						mirrored = {
							x: ft.o.scale.x < 0,
							y: ft.o.scale.y < 0
						};

					// viewBox might be scaled
					if ( ft.o.viewBoxRatio ) {
						dx *= ft.o.viewBoxRatio.x;
						dy *= ft.o.viewBoxRatio.y;
					}

					cx = dx + handle.element.ox,
					cy = dy + handle.element.oy;

					if ( handle.rotate ) {
						rad = Math.atan2(cy - ft.o.center.y - ft.o.translate.y, cx - ft.o.center.x - ft.o.translate.x);

						ft.attrs.rotate = rad * 180 / Math.PI - ft.o.angle;

						if ( mirrored[handle.axis] ) {
							ft.attrs.rotate -= 180;
						}
					}

					// Keep handle within boundaries
					if ( ft.opts.boundary ) {
						cx = Math.max(Math.min(cx, ft.opts.boundary.x + ( ft.opts.boundary.width  || getPaperSize().x * (ft.o.viewBoxRatio && ft.o.viewBoxRatio.x || 1))), ft.opts.boundary.x);
						cy = Math.max(Math.min(cy, ft.opts.boundary.y + ( ft.opts.boundary.height || getPaperSize().y * (ft.o.viewBoxRatio && ft.o.viewBoxRatio.y || 1))), ft.opts.boundary.y);
					}

					opposite   = cx - ft.o.center.x - ft.o.translate.x - ( ft.opts.customCorners ? ft.opts.customCorners.distance : 0 ),
					adjacent   = cy - ft.o.center.y - ft.o.translate.y - ( ft.opts.customCorners ? ft.opts.customCorners.distance : 0 ),
					hypotenuse = Math.sqrt(Math.pow(opposite, 2) + Math.pow(adjacent, 2));

					if ( handle.scale ) {
						ft.attrs.scale[handle.axis] = hypotenuse / ( ft.o.size[handle.axis] / 2 * ft.o.distance );

						if ( mirrored[handle.axis] ) {
							ft.attrs.scale[handle.axis] *= -1;
						}
					}

					applyLimits();

					// Maintain aspect ratio
					if ( ft.opts.keepRatio.indexOf('axis' + handle.axis.toUpperCase()) !== -1 ) {
						keepRatio(handle.axis);
					} else {
						ft.attrs.ratio = ft.attrs.scale.x / ft.attrs.scale.y;
					}

					if ( ft.attrs.scale.x && ft.attrs.scale.y ) {
						ft.apply();
					}

					asyncCallback([ handle.rotate ? 'rotate' : null, handle.scale ? 'scale' : null ]);
				}, function() {
					// Offset values
					ft.o = cloneObj(ft.attrs);

					if ( paper._viewBox ) {
						ft.o.viewBoxRatio = {
							x: paper._viewBox[2] / getPaperSize().x,
							y: paper._viewBox[3] / getPaperSize().y
						};
					}

					handle.element.ox = this.attrs.cx ? this.attrs.cx : this.attrs.x + this.attrs.width  / 2;
					handle.element.oy = this.attrs.cy ? this.attrs.cy : this.attrs.y + this.attrs.height / 2;

					if ( handle.isCorner ) {
						hypotenuse = Math.sqrt(Math.pow(ft.o.size.x * ft.o.scale.x, 2) + Math.pow(ft.o.size.y * ft.o.scale.y, 2)) / 2,
						opposite   = ft.o.size.x * ft.o.scale.x / 2,
						pos        = {
							x: handle.element.ox - ( ft.o.center.x + ft.o.x + ft.o.translate.x ),
							y: handle.element.oy - ( ft.o.center.y + ft.o.y + ft.o.translate.y )
						};

						// Distance from centre of handle to centre of element
						ft.o.distance = hypotenuse / opposite;

						ft.o.angle = 90 - ( Math.atan2(pos.x, pos.y) * 180 / Math.PI ) - ft.o.rotate;
					} else {
						ft.o.distance = ft.opts.distance;
						ft.o.angle    = handle.axis === 'y' ? 90 : 0;
					}

					asyncCallback([ handle.rotate ? 'rotate start' : null, handle.scale ? 'scale start' : null ]);
				}, function() {
					asyncCallback([ handle.rotate ? 'rotate end'   : null, handle.scale ? 'scale end'   : null ]);
				});
			});

			// Drag bbox handles
			if ( ft.opts.draw.indexOf('bbox') >= 0 && !ft.opts.customCorners && ( ft.opts.scale.indexOf('bboxCorners') !== -1 || ft.opts.scale.indexOf('bboxSides') !== -1 ) ) {
				ft.handles.bbox.map(function(handle) {
					handle.element.drag(function(dx, dy) {
						var
							sin, cos, rx, ry, rdx, rdy, mx, my, sx, sy, ratio, tdy, tdx,
							previous = cloneObj(ft.attrs),
							trans    = { x: 0, y: 0 };

						// viewBox might be scaled
						if ( ft.o.viewBoxRatio ) {
							dx *= ft.o.viewBoxRatio.x;
							dy *= ft.o.viewBoxRatio.y;
						}

						sin = ft.o.rotate.sin;
						cos = ft.o.rotate.cos;

						// First rotate dx, dy to element alignment
						rx = dx * cos - dy * sin;
						ry = dx * sin + dy * cos;

						rx *= Math.abs(handle.x);
						ry *= Math.abs(handle.y);

						// And finally rotate back to canvas alignment
						rdx = rx *   cos + ry * sin;
						rdy = rx * - sin + ry * cos;

						ft.attrs.translate = {
							x: ft.o.translate.x + rdx / 2,
							y: ft.o.translate.y + rdy / 2
						};

						// Mouse position, relative to element center after translation
						mx = ft.o.handlePos.cx + dx - ft.attrs.center.x - ft.attrs.translate.x;
						my = ft.o.handlePos.cy + dy - ft.attrs.center.y - ft.attrs.translate.y;

						// Position rotated to align with element
						rx = mx * cos - my * sin;
						ry = mx * sin + my * cos;

						// Maintain aspect ratio
						if ( handle.isCorner && ft.opts.keepRatio.indexOf('bboxCorners') !== -1 ) {
							ratio = ( ft.attrs.size.x * ft.attrs.scale.x ) / ( ft.attrs.size.y * ft.attrs.scale.y ),
							tdy   = rx * handle.x * ( 1 / ratio ),
							tdx   = ry * handle.y * ratio;

							if ( tdx > tdy * ratio ) {
								rx = tdx * handle.x;
							} else {
								ry = tdy * handle.y;
							}
						}

						// Scale element so that handle is at mouse position
						sx = rx * 2 * handle.x / ft.o.size.x;
						sy = ry * 2 * handle.y / ft.o.size.y;

						ft.attrs.scale = {
							x: sx || ft.attrs.scale.x,
							y: sy || ft.attrs.scale.y
						};

						// Check boundaries
						if ( !isWithinBoundaries().x || !isWithinBoundaries().y ) { ft.attrs = previous; }

						applyLimits();

						// Maintain aspect ratio
						if ( ( handle.isCorner && ft.opts.keepRatio.indexOf('bboxCorners') !== -1 ) || ( !handle.isCorner && ft.opts.keepRatio.indexOf('bboxSides') !== -1 ) ) {
							keepRatio(handle.axis);

							trans.x = ( ft.attrs.scale.x - ft.o.scale.x ) * ft.o.size.x * handle.x;
							trans.y = ( ft.attrs.scale.y - ft.o.scale.y ) * ft.o.size.y * handle.y;

							rx =   trans.x * cos + trans.y * sin;
							ry = - trans.x * sin + trans.y * cos;

							ft.attrs.translate.x = ft.o.translate.x + rx / 2;
							ft.attrs.translate.y = ft.o.translate.y + ry / 2;
						}

						ft.attrs.ratio = ft.attrs.scale.x / ft.attrs.scale.y;

						asyncCallback([ 'scale' ]);

						ft.apply();
					}, function() {
						var
							angle     = ( ( 360 - ft.attrs.rotate ) % 360 ) / 180 * Math.PI,
							handlePos = handle.element.attr(['x', 'y']);

						// Offset values
						ft.o = cloneObj(ft.attrs);

						ft.o.handlePos = {
							cx: handlePos.x + ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides'],
							cy: handlePos.y + ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides']
						};

						// Pre-compute rotation sin & cos for efficiency
						ft.o.rotate = {
							sin: Math.sin(angle),
							cos: Math.cos(angle)
						};

						if ( paper._viewBox ) {
							ft.o.viewBoxRatio = {
								x: paper._viewBox[2] / getPaperSize().x,
								y: paper._viewBox[3] / getPaperSize().y
							};
						}

						asyncCallback([ 'scale start' ]);
					}, function() {
						asyncCallback([ 'scale end' ]);
					});
				});
			}

			// Custom BBox corners
			if ( ft.opts.customCorners ) {
				ft.handles.bbox.map(function(handle) {
					if ( typeof ft.opts.customCorners.corners[handle.index] !== 'undefined' ) {
						if ( [ 'drag', 'rotate', 'scale' ].indexOf(ft.opts.customCorners.corners[handle.index].action) === -1 ) {
							// Unknown action, absorb drag event and emit as custom event on click
							handle.element.drag(function() {
								return false;
							});

							handle.element.click(function() {
								asyncCallback([ 'custom:' + ft.opts.customCorners.corners[handle.index].action ]);
							});
						}
					}
				});
			}

			// Drag element and center handle
			if ( ft.opts.drag.indexOf('self') >= 0 && ft.opts.scale.indexOf('self') === -1 && ft.opts.rotate.indexOf('self') === -1 ) {
				draggables.push(subject);
			}

			if ( ft.opts.drag.indexOf('center') >= 0 ) {
				draggables.push(ft.handles.center.disc);
			}

			if ( ft.opts.customCorners ) {
				ft.handles.bbox.map(function(handle) {
					if ( typeof ft.opts.customCorners.corners[handle.index] !== 'undefined' ) {
						if ( ft.opts.customCorners.corners[handle.index].action === 'drag' ) {
							draggables.push(handle.element);
						}
					}
				});
			}

			draggables.map(function(draggable) {
				draggable.drag(function(dx, dy) {
					var bbox = cloneObj(ft.o.bbox);

					// viewBox might be scaled
					if ( ft.o.viewBoxRatio ) {
						dx *= ft.o.viewBoxRatio.x;
						dy *= ft.o.viewBoxRatio.y;
					}

					ft.attrs.translate.x = ft.o.translate.x + dx;
					ft.attrs.translate.y = ft.o.translate.y + dy;

					bbox.x += dx;
					bbox.y += dy;

					applyLimits(bbox);

					asyncCallback([ 'drag' ]);

					ft.apply();
				}, function() {
					// Offset values
					ft.o = cloneObj(ft.attrs);

					if ( ft.opts.snap.drag ) {
						ft.o.bbox = subject.getBBox();
					}

					// viewBox might be scaled
					if ( paper._viewBox ) {
						ft.o.viewBoxRatio = {
							x: paper._viewBox[2] / getPaperSize().x,
							y: paper._viewBox[3] / getPaperSize().y
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
					asyncCallback([ 'drag end' ]);
				});
			});

			rotate = ft.opts.rotate.indexOf('self') >= 0,
			scale  = ft.opts.scale .indexOf('self') >= 0;

			if ( rotate || scale ) {
				subject.drag(function(dx, dy, x, y) {
					var
						rad, radius,
						mirrored = {
							x: ft.o.scale.x < 0,
							y: ft.o.scale.y < 0
						};

					if ( rotate ) {
						rad = Math.atan2(y - ft.o.center.y - ft.o.translate.y, x - ft.o.center.x - ft.o.translate.x);

						ft.attrs.rotate = ft.o.rotate + ( rad * 180 / Math.PI ) - ft.o.deg;
					}

					if ( scale ) {
						radius = Math.sqrt(Math.pow(x - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(y - ft.o.center.y - ft.o.translate.y, 2));

						ft.attrs.scale.x = ft.attrs.scale.y = ( mirrored.x ? -1 : 1 ) * ft.o.scale.x + ( radius - ft.o.radius ) / ( ft.o.size.x / 2 );

						if ( mirrored.x ) { ft.attrs.scale.x *= -1; }
						if ( mirrored.y ) { ft.attrs.scale.y *= -1; }
					}

					applyLimits();

					ft.apply();

					asyncCallback([ rotate ? 'rotate' : null, scale ? 'scale' : null ]);
				}, function(x, y) {
					// Offset values
					ft.o = cloneObj(ft.attrs);

					ft.o.deg = Math.atan2(y - ft.o.center.y - ft.o.translate.y, x - ft.o.center.x - ft.o.translate.x) * 180 / Math.PI;

					ft.o.radius = Math.sqrt(Math.pow(x - ft.o.center.x - ft.o.translate.x, 2) + Math.pow(y - ft.o.center.y - ft.o.translate.y, 2));

					// viewBox might be scaled
					if ( paper._viewBox ) {
						ft.o.viewBoxRatio = {
							x: paper._viewBox[2] / getPaperSize().x,
							y: paper._viewBox[3] / getPaperSize().y
						};
					}

					asyncCallback([ rotate ? 'rotate start' : null, scale ? 'scale start' : null ]);
				}, function() {
					asyncCallback([ rotate ? 'rotate end'   : null, scale ? 'scale end'   : null ]);
				});
			}

			ft.updateHandles();

			return ft;
		};

		/**
		 * Remove handles
		 */
		ft.hideHandles = function(opts) {
			var opts = opts || {}

			if ( opts.undrag === undefined ) {
				opts.undrag = true;
			}

			if ( opts.undrag ) {
				ft.items.map(function(item) {
					item.el.undrag();
				});
			}

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

				if ( ft.handles.bbox ) {
					ft.handles.bbox.map(function(handle) {
						handle.element.remove();
					});

					ft.handles.bbox = null;
				}
			}

			if ( ft.circle ) {
				ft.circle.remove();

				ft.circle = null;
			}

			return ft;
		};

		// Override defaults
		ft.setOpts = function(options, callback) {
			var i, j;

			if ( callback !== undefined ) {
				ft.callback = typeof callback === 'function' ? callback : false;
			}

			for ( i in options ) {
				if ( options[i] && options[i].constructor === Object ) {
					if(ft.opts[i] === false){
            ft.opts[i] = {};
          }
					for ( j in options[i] ) {
						if ( options[i].hasOwnProperty(j) ) {
							ft.opts[i][j] = options[i][j];
						}
					}
				} else {
					ft.opts[i] = options[i];
				}
			}

			if ( ft.opts.animate === true ) {
				ft.opts.animate = { delay: 700, easing: 'linear' };
			}

			if ( ft.opts.drag === true ) {
				ft.opts.drag = [ 'center', 'self' ];
			}

			if ( ft.opts.keepRatio === true ) {
				ft.opts.keepRatio = [ 'axisX', 'axisY', 'bboxCorners', 'bboxSides' ];
			}

			if ( ft.opts.rotate === true ) {
				ft.opts.rotate = [ 'axisX', 'axisY' ];
			}

			if ( ft.opts.scale === true ) {
				ft.opts.scale = [ 'axisX', 'axisY', 'bboxCorners', 'bboxSides' ];
			}

			[ 'drag', 'draw', 'keepRatio', 'rotate', 'scale' ].map(function(option) {
				if ( ft.opts[option] === false ) {
					ft.opts[option] = [];
				}
			});

			ft.axes = [];

			if ( ft.opts.rotate.indexOf('axisX') >= 0 || ft.opts.scale.indexOf('axisX') >= 0 ) {
				ft.axes.push('x');
			}

			if ( ft.opts.rotate.indexOf('axisY') >= 0 || ft.opts.scale.indexOf('axisY') >= 0 ) {
				ft.axes.push('y');
			}

			[ 'drag', 'rotate', 'scale' ].map(function(option) {
				if ( !ft.opts.snapDist[option] ) {
					ft.opts.snapDist[option] = ft.opts.snap[option];
				}
			});

			// Force numbers
			ft.opts.range = {
				rotate: [ parseFloat(ft.opts.range.rotate[0]), parseFloat(ft.opts.range.rotate[1]) ],
				scale:  [ parseFloat(ft.opts.range.scale[0]),  parseFloat(ft.opts.range.scale[1])  ]
			};

			ft.opts.snap = {
				drag:   parseFloat(ft.opts.snap.drag)   || 0,
				rotate: parseFloat(ft.opts.snap.rotate) || 0,
				scale:  parseFloat(ft.opts.snap.scale)  || 0
			};

			ft.opts.snapDist = {
				drag:   parseFloat(ft.opts.snapDist.drag)   || 0,
				rotate: parseFloat(ft.opts.snapDist.rotate) || 0,
				scale:  parseFloat(ft.opts.snapDist.scale)  || 0
			};

			if ( typeof ft.opts.size === 'string' ) {
				ft.opts.size = parseFloat(ft.opts.size) || 0;
			}

			if ( !isNaN(ft.opts.size) ) {
				ft.opts.size = {
					axes:        ft.opts.size,
					bboxCorners: ft.opts.size,
					bboxSides:   ft.opts.size,
					center:      ft.opts.size
				};
			}

			if ( ft.opts.customCorners ) {
				ft.opts.customCorners.size     = parseFloat(ft.opts.customCorners.size)     || 0;
				ft.opts.customCorners.distance = parseFloat(ft.opts.customCorners.distance) || 0;
			}

			ft.showHandles();

			asyncCallback([ 'init' ]);

			return ft;
		};

		ft.setOpts(options, callback);

		/**
		 * Apply transformations, optionally update attributes manually
		 */
		ft.apply = function() {
			ft.items.map(function(item, i) {
				// Take offset values into account
				var
					center = {
						x: ft.attrs.center.x + ft.offset.translate.x,
						y: ft.attrs.center.y + ft.offset.translate.y
					},
					rotate    = ft.attrs.rotate - ft.offset.rotate,
					scale     = {
						x: ft.attrs.scale.x / ft.offset.scale.x,
						y: ft.attrs.scale.y / ft.offset.scale.y
					},
					translate = {
						x: ft.attrs.translate.x - ft.offset.translate.x,
						y: ft.attrs.translate.y - ft.offset.translate.y
					};

				if ( ft.opts.animate ) {
					asyncCallback([ 'animate start' ]);

					item.el.animate(
						{ transform: [
							'R', rotate, center.x, center.y,
							'S', scale.x, scale.y, center.x, center.y,
							'T', translate.x, translate.y
						] + ft.items[i].transformString },
						ft.opts.animate.delay,
						ft.opts.animate.easing,
						function() {
							asyncCallback([ 'animate end' ]);

							ft.updateHandles();
						}
					);
				} else {
					item.el.transform([
						'R', rotate, center.x, center.y,
						'S', scale.x, scale.y, center.x, center.y,
						'T', translate.x, translate.y
					] + ft.items[i].transformString);

					asyncCallback([ 'apply' ]);

					ft.updateHandles();
				}
			});

			return ft;
		};

		/**
		 * Clean exit
		 */
		ft.unplug = function() {
			var attrs = ft.attrs;

			ft.hideHandles();

			// Goodbye
			delete subject.freeTransform;

			return attrs;
		};

		// Store attributes for each item
		function scan(subject) {
			( subject.type === 'set' ? subject.items : [ subject ] ).map(function(item) {
				if ( item.type === 'set' ) {
					scan(item);
				} else {
					ft.items.push({
						el: item,
						attrs: {
							rotate:    0,
							scale:     { x: 1, y: 1 },
							translate: { x: 0, y: 0 }
						},
						transformString: item.matrix.toTransformString()
					});
				}
			});
		}

		scan(subject);

		// Get the current transform values for each item
		ft.items.map(function(item, i) {
			if ( item.el._ && item.el._.transform && typeof item.el._.transform === 'object' ) {
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
		if ( subject.type !== 'set' ) {
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

		ft.attrs.ratio = ft.attrs.scale.x / ft.attrs.scale.y;

		/**
		 * Get rotated bounding box
		 */
		function getBBox(distance) {
			var
				rad, radius,
				corners = [],
				signs   = [ { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 } ];

			if ( typeof distance !== 'number' ) {
				distance = 0;
			}

			rad = {
				x: ( ft.attrs.rotate      ) * Math.PI / 180,
				y: ( ft.attrs.rotate + 90 ) * Math.PI / 180
			};

			radius = {
				x: ft.attrs.size.x / 2 * ft.attrs.scale.x + distance,
				y: ft.attrs.size.y / 2 * ft.attrs.scale.y + distance
			};

			signs.map(function(sign) {
				corners.push({
					x: ( ft.attrs.center.x + ft.attrs.translate.x + sign.x * radius.x * Math.cos(rad.x) ) + sign.y * radius.y * Math.cos(rad.y),
					y: ( ft.attrs.center.y + ft.attrs.translate.y + sign.x * radius.x * Math.sin(rad.x) ) + sign.y * radius.y * Math.sin(rad.y)
				});
			});

			return corners;
		}

		/**
		 * Get dimension of the paper
		 */
		function getPaperSize() {
			var match = {
				x: /^([0-9]+)%$/.exec(paper.width),
				y: /^([0-9]+)%$/.exec(paper.height)
			};

			return {
				x: match.x ? paper.canvas.clientWidth  || paper.canvas.parentNode.clientWidth  * parseInt(match.x[1], 10) * 0.01 : paper.canvas.clientWidth  || paper.width,
				y: match.y ? paper.canvas.clientHeight || paper.canvas.parentNode.clientHeight * parseInt(match.y[1], 10) * 0.01 : paper.canvas.clientHeight || paper.height
			};
		}

		/**
		 * Apply limits
		 */
		function applyLimits(bbox) {
			var
				x, y, deg,
				dist = { x: 0, y: 0 },
				snap = { x: 0, y: 0 };

			// Snap to grid
			if ( bbox && ft.opts.snap.drag ) {
				x = bbox.x,
				y = bbox.y,

				[ 0, 1 ].map(function() {
					// Top and left sides first
					dist.x = x - Math.round(x / ft.opts.snap.drag) * ft.opts.snap.drag;
					dist.y = y - Math.round(y / ft.opts.snap.drag) * ft.opts.snap.drag;

					if ( Math.abs(dist.x) <= ft.opts.snapDist.drag ) { snap.x = dist.x; }
					if ( Math.abs(dist.y) <= ft.opts.snapDist.drag ) { snap.y = dist.y; }

					// Repeat for bottom and right sides
					x += bbox.width  - snap.x;
					y += bbox.height - snap.y;
				});

				ft.attrs.translate.x -= snap.x;
				ft.attrs.translate.y -= snap.y;
			}

			// Keep center within boundaries
			if ( ft.opts.boundary ) {
				ft.opts.boundarywidth  = ft.opts.boundarywidth  || getPaperSize().x * (ft.o.viewBoxRatio && ft.o.viewBoxRatio.x || 1);
				ft.opts.boundaryheight = ft.opts.boundaryheight || getPaperSize().y * (ft.o.viewBoxRatio && ft.o.viewBoxRatio.y || 1);

				if ( ft.attrs.center.x + ft.attrs.translate.x < ft.opts.boundary.x ) {
					ft.attrs.translate.x += ft.opts.boundary.x - ( ft.attrs.center.x + ft.attrs.translate.x );
				}

				if ( ft.attrs.center.y + ft.attrs.translate.y < ft.opts.boundary ) {
					ft.attrs.translate.y += ft.opts.boundary - ( ft.attrs.center.y + ft.attrs.translate.y );
				}

				if ( ft.attrs.center.x + ft.attrs.translate.x > ft.opts.boundary.x + ft.opts.boundarywidth  ) {
					ft.attrs.translate.x += ft.opts.boundary.x + ft.opts.boundarywidth - ( ft.attrs.center.x + ft.attrs.translate.x );
				}

				if ( ft.attrs.center.y + ft.attrs.translate.y > ft.opts.boundary + ft.opts.boundaryheight ) {
					ft.attrs.translate.y += ft.opts.boundary + ft.opts.boundaryheight - ( ft.attrs.center.y + ft.attrs.translate.y );
				}
			}

			// Snap to angle, rotate with increments
			dist = Math.abs(ft.attrs.rotate % ft.opts.snap.rotate);
			dist = Math.min(dist, ft.opts.snap.rotate - dist);

			if ( dist < ft.opts.snapDist.rotate ) {
				ft.attrs.rotate = Math.round(ft.attrs.rotate / ft.opts.snap.rotate) * ft.opts.snap.rotate;
			}

			// Snap to scale, scale with increments
			dist = {
				x: Math.abs(( ft.attrs.scale.x * ft.attrs.size.x ) % ft.opts.snap.scale),
				y: Math.abs(( ft.attrs.scale.y * ft.attrs.size.x ) % ft.opts.snap.scale)
			};

			dist = {
				x: Math.min(dist.x, ft.opts.snap.scale - dist.x),
				y: Math.min(dist.y, ft.opts.snap.scale - dist.y)
			};

			if ( dist.x < ft.opts.snapDist.scale ) {
				ft.attrs.scale.x = Math.round(ft.attrs.scale.x * ft.attrs.size.x / ft.opts.snap.scale) * ft.opts.snap.scale / ft.attrs.size.x;
			}

			if ( dist.y < ft.opts.snapDist.scale ) {
				ft.attrs.scale.y = Math.round(ft.attrs.scale.y * ft.attrs.size.y / ft.opts.snap.scale) * ft.opts.snap.scale / ft.attrs.size.y;
			}

			// Limit range of rotation
			if ( ft.opts.range.rotate ) {
				deg = ( 360 + ft.attrs.rotate ) % 360;

				if ( deg > 180 ) { deg -= 360; }

				if ( deg < ft.opts.range.rotate[0] ) { ft.attrs.rotate += ft.opts.range.rotate[0] - deg; }
				if ( deg > ft.opts.range.rotate[1] ) { ft.attrs.rotate += ft.opts.range.rotate[1] - deg; }
			}

			// Limit scale
			if ( ft.opts.range.scale ) {
				if ( ft.attrs.scale.x * ft.attrs.size.x < ft.opts.range.scale[0] ) {
					ft.attrs.scale.x = ft.opts.range.scale[0] / ft.attrs.size.x;
				}

				if ( ft.attrs.scale.y * ft.attrs.size.y < ft.opts.range.scale[0] ) {
					ft.attrs.scale.y = ft.opts.range.scale[0] / ft.attrs.size.y;
				}

				if ( ft.attrs.scale.x * ft.attrs.size.x > ft.opts.range.scale[1] ) {
					ft.attrs.scale.x = ft.opts.range.scale[1] / ft.attrs.size.x;
				}

				if ( ft.attrs.scale.y * ft.attrs.size.y > ft.opts.range.scale[1] ) {
					ft.attrs.scale.y = ft.opts.range.scale[1] / ft.attrs.size.y;
				}
			}
		}

		function isWithinBoundaries() {
			return {
				x: ft.attrs.scale.x * ft.attrs.size.x >= ft.opts.range.scale[0] && ft.attrs.scale.x * ft.attrs.size.x <= ft.opts.range.scale[1],
				y: ft.attrs.scale.y * ft.attrs.size.y >= ft.opts.range.scale[0] && ft.attrs.scale.y * ft.attrs.size.y <= ft.opts.range.scale[1]
			};
		}

		function keepRatio(axis) {
			if ( axis === 'x' ) {
				ft.attrs.scale.y = ft.attrs.scale.x / ft.attrs.ratio;
			} else {
				ft.attrs.scale.x = ft.attrs.scale.y * ft.attrs.ratio;
			}
		}

		/**
		 * Recursive copy of object
		 */
		function cloneObj(obj) {
			var i, clone = {};

			for ( i in obj ) {
				clone[i] = typeof obj[i] === 'object' ? cloneObj(obj[i]) : obj[i];
			}

			return clone;
		}

		/**
		 * Call callback asynchronously for better performance
		 */
		function asyncCallback(e) {
			var events = [];

			if ( ft.callback ) {
				// Remove empty values
				e.map(function(e, i) {
					if ( e ) {
						events.push(e);
					}
				});

				clearTimeout(timeout);

				timeout = setTimeout(function() {
					if ( ft.callback ) {
						ft.callback(ft, events, getBBox());
					}
				}, .1);
			}
		}

		ft.updateHandles();

		// Enable method chaining
		return ft;
	};
}));
