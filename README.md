Raphael.FreeTransform
====================

  Free transform tool Raphaël elements with many options.

  ![Screenshot](https://github.com/ElbertF/Raphael.FreeTransform/raw/master/screenshot.png)


Example
-------

```html
<script type="text/javascript" src="raphael-min.js"></script>
<script type="text/javascript" src="raphael.free_transform.js"></script>

<div id="foo"></div>

<script type="text/javascript">
	var paper = Raphael(0, 0, 500, 500);

	var rect = paper
		.rect(200, 200, 100, 100)
		.attr('fill', '#f00')
		;

	// Add free transform handle
	paper.freeTransform(rect);

	// Remove free transform handle
	// paper.freeTransform(rect).unplug();
</script>
```

Options
-------

`boundary`

`color`

`drag`

`rotate`

`scale`

`size`


Functions
---------

`unplug()`

`updateHandle()`
