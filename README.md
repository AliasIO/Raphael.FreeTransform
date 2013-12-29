Raphaël.FreeTransform
====================

  Free transform tool for [Raphaël 2.0](http://raphaeljs.com/) elements and sets with many options. Supports snap-to-grid dragging, scaling and rotating with a specified interval and range.

  ![Screenshot](https://github.com/ElbertF/Raphael.FreeTransform/raw/master/screenshot.png)

  *Licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).*

  ![Icon](http://alias.io/images/bitcoin_16x16.png) Donate Bitcoin: 1PgSBQXVBpVHxZKmQpaJDULyPwqw9ieVcT - *Thanks!*

Demo
----

  http://alias.io/raphael/free_transform/

Examples
--------

```html
<script type="text/javascript" src="raphael-min.js"></script>
<script type="text/javascript" src="raphael.free_transform.js"></script>

<div id="holder" style="height: 100%;"></div>

<script type="text/javascript">
	var paper = Raphael(0, 0, 500, 500);

	var rect = paper
		.rect(200, 200, 100, 100)
		.attr('fill', '#f00')
		;

	// Add freeTransform
	var ft = paper.freeTransform(rect);

	// Hide freeTransform handles
	ft.hideHandles();

	// Show hidden freeTransform handles
	ft.showHandles();

	// Apply transformations programmatically
	ft.attrs.rotate = 45;

	ft.apply();

	// Remove freeTransform completely
	ft.unplug();

	// Add freeTransform with options and callback
	ft = paper.freeTransform(rect, { keepRatio: true }, function(ft, events) {
		console.log(ft.attrs);
	});

	// Change options on the fly
	ft.setOpts({ keepRatio: false });
</script>
```

Options
-------

#### `animate: true | { delay: num, easing: string } | false`

Animate transformations. Works best in combination with `apply()` (see the functions section below).

Default: `{ delay: 700, easing: 'linear' }`


#### `attrs: { fill: hex, stroke: hex }`

Sets the attributes of the handles.

Default: `{ fill: '#fff', stroke: '#000' }`


#### `boundary: { x: int, y: int, width: int, height: int } | false`

Limits the drag area of the handles.

Default: dimensions of the paper


#### `distance: num`

Sets the distance of the handles from the center of the element (`num` times radius).

Default: `1.3`


#### `drag: true | [ 'center', 'self' ] | false`

Enables/disables dragging.

Default: `[ 'center', 'self' ]`


#### `draw: [ 'bbox', 'circle' ]`

Additional elements to draw.

Default: `false`


#### `keepRatio: true | [ 'axisX', 'axisY', 'bboxCorners', 'bboxSides' ] | false`

Scale axes together or individually.

Default: `false`


#### `range: { rotate: [ num, num ], scale: [ num, num ] }`

Limit the range of transformation.

Default: `{ rotate: [ -180, 180 ], scale: [ 0, 99999 ] }`


#### `rotate: true | [ 'axisX', 'axisY', 'self' ]|false`

Enables/disables rotating.

Default: `[ 'axisX', 'axisY' ]`


#### `scale: true | [ 'axisX', 'axisY', 'bboxCorners', 'bboxSides' ] | false`

Enables/disables scaling.

Default: `[ 'axisX', 'axisY', 'bboxCorners', 'bboxSides' ]`


#### `snap: { rotate: num, scale: num, drag: num }`: 

Snap transformations to num degrees (rotate) or pixels (scale, drag).

Default: `{ rotate: 0, scale: 0, drag: 0 }`


#### `snapDist: { rotate: num, scale: num, drag: num }`

Snap distance in degrees (rotate) or pixels (scale, drag).

Default: `{ rotate: 0, scale: 0, drag: 7 }`


#### `size: num | { axes: num, bboxCorners: num, bboxSides: num, center: num }`

Sets the radius of the handles in pixels.

Default: `5`


Callback
--------

A callback function can be specified to capture changes and events.


Functions
---------

#### `apply()`

Programmatically apply transformations (see the example above).


#### `hideHandles( opts )`

Removes handles but keeps values set by the plugin in memory. By
default removes all drag events from the elements. If you'd like to
keep then while the handles are hidden, pass ``{undrag: false}`` to
hideHandles().


#### `showHandles()`

Shows handles hidden with `hideHandles()`.


#### `setOpts( object, function )`

Update options and callback.


#### `unplug()`

Removes handles and deletes all values set by the plugin.


#### `updateHandles()`

Updates handles to reflect the element's transformations.


Raphaël.FreeTransform and Raphaël.JSON
--------------------------------------

Instructions on how to use Raphaël.FreeTransform in combination with
Raphaël.JSON can be found 
[here](https://github.com/ElbertF/Raphael.JSON#raphaëljson-and-raphaëlfreetransform).

