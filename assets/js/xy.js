/**
 * xy
 * @version 1.0.10
 * @summary 07-20-2022
 * @author Mads Stoumann
 * @description XY Controller
*/
export default function xy(elm, config) {
	const settings = Object.assign({
		eventScope: elm,
		gridX: 0,
		gridY: 0,
		leave: true,
		minX: 0,
		maxX: 100,
		minY: 0,
		maxY: 100,
		shift: 10,
		x: 50,
		y: 50 
	}, config);

	let active = false, areaX, areaY, maxX, maxY, pointsize, ratioX, ratioY, snapX, snapY, xCurrent, yCurrent, x = settings.x, y = settings.y;
	const difX = settings.maxX - settings.minX;
	const difY = settings.maxY - settings.minY;
	const ro = new ResizeObserver(() => { refresh(); xyset(x, y); update()});
	const point = elm.elements.xyPoint;

	elm.style.setProperty('--xy-grid-x', settings.gridX);
	elm.style.setProperty('--xy-grid-y', settings.gridY);

	elm.addEventListener('keydown', keymove);
	elm.addEventListener('pointerdown', down);
	if (settings.leave) elm.addEventListener('pointerleave', () => elm.dispatchEvent(new Event('pointerup')));
	elm.addEventListener('pointermove', move);
	elm.addEventListener('pointerup', up);
	ro.observe(elm);

	/**
	 * @function keymove
	 * @param {Event} e
	 * @description Handles keyboard-navigation with arrow-keys.
	*/
	function keymove(e) {
		let valX = e.shiftKey ? e.altKey ? 1 : settings.shift * ratioX : ratioX;
		const valY = e.shiftKey ? e.altKey ? 1 : settings.shift * ratioY : ratioY;
		let x = elm.style.getPropertyValue('--tx')-0;
		let y = elm.style.getPropertyValue('--ty')-0;
		if (e.key !== 'Tab') e.preventDefault();

		switch(e.key) {
			case 'ArrowDown': if (snapY) { y+= snapY } else { y+= valY }; break;
			case 'ArrowLeft': if (snapX) { x-= snapX } else { x-= valX }; break;
			case 'ArrowRight': if (snapX) { x+= snapX } else { x+= valX; }; break;
			case 'ArrowUp': if (snapY) { y-= snapY } else { y-= valY }; break;
			case 'End': if (e.ctrlKey) { y = maxY } else { x = maxX }; break;
			case 'Home': if (e.ctrlKey) { y = 0 } else { x = 0 }; break;
			case ' ': customEvent('xytoggle'); break;
			default: break;
		}
		xCurrent = x;
		yCurrent = y;
		update();
	}

	/**
	 * @function customEvent
	 * @param {String} name
	 * @param {Object} [obj]
	 * @description Dispatches a custom event
	*/
	function customEvent(name, obj = {}) {
		settings.eventScope.dispatchEvent(new CustomEvent(name, obj));
	}

	/**
	 * @function down
	 * @param {Event} e
	 * @description Pointer down, set values, dispatch event.
	*/
	function down(e) {
		active = true;
		elm.dataset.active = 1;
		customEvent('xydown');
		update(e);
	}

	/**
	 * @function move
	 * @param {Event} e
	 * @description Pointer move, updates current coordinates, calls `update`.
	*/
	function move(e) {
		if (active) update(e);
	}

	/**
	 * @function refresh
	 * @description Refreshes variables based on element-dimensions, when element is resized.
	*/
	function refresh() {
		pointsize = point.offsetWidth;
		areaX = elm.offsetWidth;
		areaY = elm.offsetHeight;
		ratioX = ((areaX - pointsize) / difX);
		ratioY = ((areaY - pointsize) / difY);
		maxX = areaX - pointsize;
		maxY = areaY - pointsize;
		snapX = settings.gridX ? areaX / settings.gridX : 0;
		snapY = settings.gridY ? areaY / settings.gridY : 0;
	}

	/**
	 * @function up
	 * @description Pointer up, set initial values, dispatch event.
	*/
	function up() {
		active = false;
		elm.dataset.active = 0;
		customEvent('xyup');
	}
	
	/**
	 * @function update
	 * @param {Event} e
	 * @description Check coordinate boundaries, sets them to max values if they're greater, before calling `update`-method
	*/
	function update(e) {
		if (e) {
			xCurrent = e.offsetX - (pointsize / 2);
			yCurrent = e.offsetY - (pointsize / 2);
		}

		/* Snap-to-grid, if enabled */
		if (snapX) xCurrent = Math.round(xCurrent / snapX) * snapX;
		if (snapY) yCurrent = Math.round(yCurrent / snapY) * snapY;

		/* Check boundaries: top, right, bottom, left */
		if (yCurrent < 0) yCurrent = 0;
		if (xCurrent > maxX) xCurrent = maxX;
		if (yCurrent > maxY) yCurrent = maxY;
		if (xCurrent < 0) xCurrent = 0;

		updateXY(xCurrent, yCurrent);
	}

	/**
	 * @function updateXY
	 * @param {Number} tx
	 * @param {Number} ty
	 * @description Updates x and y values from current coordinates. Sets CSS custom properties used for `translate`, dispatches an event with an object.
	*/
	function updateXY(tx, ty) {
		x = tx * (difX / (areaX - pointsize)) + settings.minX;
		y = difY - ty * (difY / (areaY - pointsize)) + settings.minY;
		elm.style.setProperty('--tx', tx);
		elm.style.setProperty('--ty', ty);

		/* if gridX/gridY is used, get current "cell" from tx and ty */
		const gx = snapX ? (tx / snapX) + 1 : 1;
		const gy = snapY ? (ty / snapY) + 1 : 1;
		customEvent('xymove', { detail: { x, y, tx, ty, gx, gy } });
	}

	/**
	 * @function xyset
	 * @param {Number} x
	 * @param {Number} y
	 * @description Sets coordinates from x- and y-values.
	*/
	function xyset(x, y) {
		xCurrent = (x - settings.minX) * ratioX;
		yCurrent = ((difY - y) + settings.minY) * ratioY;
	}
}