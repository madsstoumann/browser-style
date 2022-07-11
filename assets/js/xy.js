/**
 * xy
 * @version 1.0.08
 * @summary 07-11-2022
 * @author Mads Stoumann
 * @description XY Controller
*/
export default function xy(pad, config) {
	const settings = Object.assign({
		leave: true,
		minX: 0,
		maxX: 100,
		minY: 0,
		maxY: 100,
		eventScope: pad,
		shift: 10,
		snapX: 0,
		snapY: 0,
		x: 50,
		y: 50 
	}, config);

	let active = false, areaX, areaY, maxX, maxY, ratioX, ratioY, xCurrent, yCurrent, x = settings.x, y = settings.y;
	const difX = settings.maxX - settings.minX;
	const difY = settings.maxY - settings.minY;
	const ro = new ResizeObserver(() => { refresh(); xyset(x, y); checkUpdate()});
	const point = pad.elements.xyPoint;
	const pointsize = point.offsetWidth;

	pad.addEventListener('keydown', keymove);
	pad.addEventListener('pointerdown', down);
	if (settings.leave) pad.addEventListener('pointerleave', () => pad.dispatchEvent(new Event('pointerup')));
	pad.addEventListener('pointermove', move);
	pad.addEventListener('pointerup', up);
	ro.observe(pad);

	/**
	 * @function keymove
	 * @param {Event} e
	 * @description Handles keyboard-navigation with arrow-keys. `Escape` triggers an “xyup”-event.
	*/
	function keymove(e) {
		const valX = e.shiftKey ? settings.shift * ratioX : 1 * ratioX;
		const valY = e.shiftKey ? settings.shift * ratioY : 1 * ratioY;
		let x = parseInt(pad.style.getPropertyValue('--tx')||0);
		let y = parseInt(pad.style.getPropertyValue('--ty')||0);
		if (e.key !== 'Tab') e.preventDefault();		
		switch(e.key) {
			case 'ArrowDown': y = y + valY; break;
			case 'ArrowLeft': x = x - valX; break;
			case 'ArrowRight': x = x + valX; break;
			case 'ArrowUp': y = y - valY; break;
			case ' ': customEvent('xytoggle'); break;
			default: break;
		}
		xCurrent = x;
		yCurrent = y;
		checkUpdate();
	}

	/**
	 * @function checkUpdate
	 * @param {Event} e
	 * @description Check coordinate boundaries, sets them to max values if they're greater, before calling `update`-method
	*/
	function checkUpdate(e) {
		if (e) {
			xCurrent = e.offsetX - (pointsize / 2);
			yCurrent = e.offsetY - (pointsize / 2);
		}

		/* Snap-to-grid, if enabled */
		if (settings.snapX) xCurrent = Math.round(xCurrent / settings.snapX) * settings.snapX;
		if (settings.snapY) yCurrent = Math.round(yCurrent / settings.snapY) * settings.snapY;

		/* Check boundaries: top, right, bottom, left */
		if (yCurrent < 0) yCurrent = 0;
		if (xCurrent > maxX) xCurrent = maxX;
		if (yCurrent > maxY) yCurrent = maxY;
		if (xCurrent < 0) xCurrent = 0;
		update(xCurrent, yCurrent);
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
		pad.dataset.active = 1;
		customEvent('xydown');
		checkUpdate(e);
	}

	/**
	 * @function move
	 * @param {Event} e
	 * @description Pointer move, updates current coordinates, calls `checkUpdate`.
	*/
	function move(e) {
		if (active) checkUpdate(e);
	}

	/**
	 * @function refresh
	 * @description Refreshes variables based on element-dimensions, when element is resized.
	*/
	function refresh() {
		areaX = pad.offsetWidth;
		areaY = pad.offsetHeight;
		ratioX = ((areaX - pointsize) / difX);
		ratioY = ((areaY - pointsize) / difY);
		maxX = areaX - pointsize;
		maxY = areaY - pointsize;
	}

	/**
	 * @function up
	 * @description Pointer up, set initial values, dispatch event.
	*/
	function up() {
		active = false;
		pad.dataset.active = 0;
		customEvent('xyup');
	}

	/**
	 * @function update
	 * @param {Number} tx
	 * @param {Number} ty
	 * @description Updates x and y values from current coordinates. Sets CSS custom properties used for `translate`, dispatches an event with an object.
	*/
	function update(tx, ty) {
		x = tx * (difX / (areaX - pointsize)) + settings.minX;
		y = difY - ty * (difY / (areaY - pointsize)) + settings.minY;
		pad.style.setProperty('--tx', tx);
		pad.style.setProperty('--ty', ty);
		customEvent('xymove', { detail: { x, y, tx, ty } });
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