Raphael.FreeTransform
====================

  Free transform tool for [Raphaël 2.0](http://raphaeljs.com/) elements and sets with many options. Supports snap-to-grid dragging, scaling and rotating within a specified interval and range.

  ![Screenshot](https://github.com/ElbertF/Raphael.FreeTransform/raw/master/screenshot.png)

  *Licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).*

Demo
----

  http://elbertf.com/raphael/free_transform/

Example
-------

```html
<script type="text/javascript" src="raphael-min.js"></script>
<script type="text/javascript" src="raphael.free_transform.js"></script>

<div id="holder"></div>

<script type="text/javascript">
	var paper = Raphael(0, 0, 500, 500);

	var rect = paper
		.rect(200, 200, 100, 100)
		.attr('fill', '#f00')
		;

	// Add free transform handle
	paper.freeTransform(rect);

	// Remove free transform handle
	paper.freeTransform(rect).unplug();

	// Add free transform handle with options and callback
	paper.freeTransform(rect, { keepRatio: true }, function(ft) {
		console.log(ft.attrs);
	});

	// Change options on the fly
	paper.freeTransform(rect).setOpts({ keepRatio: false })
</script>
```

Options
-------

`attrs: { fill: hex, stroke: hex }`

Sets the attributes of the handle (default: `{ fill: '#000', stroke: '#000' }`).

`boundary: { x: int, y: int, width: int, height: int }`

Limits the drag area of the handle (default: dimensions of the paper).

`drag: true|false`

Enables/disables dragging (default: `true`).

`dragRotate: true|false`

Rotate the subject by dragging (default: `false`).

`dragScale: true|false`

Scale the subject by dragging (default: `false`).

`grid: num|false`

Set grid size for aligning elements (default: `false`).

`gridSnap: num`

Snap edges to grid when `num` pixels away from grid (default: value of `grid`).

`keepRatio: true|false`

Scale axes together or individually (default: `false`)

`rotate: true|false`

Enables/disables rotating (default: `true`).

`rotateRange: [ int, int ]`

Limit the range of rotation (default: `[ -180, 180 ]`)

`rotateSnap`: num|false

Rotate with n degree increments (default: `false`).

`scale: num`

Enables/disables scaling (default: `true`).

`size: num`

Sets the size of the handle (`num` times radius, default: `1.2`).


Callback
--------

A callback function can be specified to capture changes.


Functions
---------

`setOpts( object, function )`

Update options and callback.

`unplug()`

Removes handle and deletes all values set by the plugin.

`updateHandles()`

Updates handles to reflect the element's transformations.
