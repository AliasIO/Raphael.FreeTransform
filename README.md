Raphael.FreeTransform
====================

  Free transform tool for [Raphaël](http://raphaeljs.com/) elements with many options. Supports dragging, scaling and rotating.

  ![Screenshot](https://github.com/ElbertF/Raphael.FreeTransform/raw/master/screenshot.png)

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

	/*
	// Add free transform handle with options
	paper.freeTransform(rect, { keepRatio: true });

	// Add free transform handle with options and callback
	paper.freeTransform(rect, { keepRatio: true }, function(thing) {
		console.log(thing);
	});

	// Remove free transform handle
	paper.freeTransform(rect).unplug();
	*/
</script>
```

Options
-------

`boundary: { x: int, y: int, width: int, height: int }`

Limits the drag area of the handle (default: dimensions of the paper).

`color: hex`

Sets the color of the handle (default: `#000`).

`drag: true|false`

Enables/disables dragging (default: `true`).

`keepRatio: true|false`

Scale axes together or individually (default: `false`)

`rotate: true|false`

Enables/disables rotating (default: `true`).

`rotateSnap`: num|false

Rotate with n degree increments (default: `false`).

`scale: num`

Enables/disables scaling (default: `true`).

`size: num`

Sets the size of the handle (n times radius, default: `1.2`).


Functions
---------

`unplug()`

Removes handle and deletes all values set by the plugin.

`updateHandle()`

Updates handle to reflect the element's properties.
