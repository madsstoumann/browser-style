/**
 * colorPicker
 * @version 1.0.06
 * @summary 07-20-2022
 * @author Mads Stoumann
 * @description Color Picker
 * @requires module:xypad.mjs
*/
import xy from'./xy.js';
export default function colorPicker(app, config) {
	const settings = Object.assign({
		scope: app
	}, config);

	/* helper methods, color-convertion */
	const rgb2arr = (rgb) => { const seperator = rgb.includes(',') ? ',' : ' '; return rgb.replace(/rgba?\((.*?)\)/, '$1').split(seperator);}
	const rgb2hex = (rgb) => `#${rgb2arr(rgb).map((c, i) => i < 3 ? parseInt(c, 10).toString(16).padStart(2,'0') : Math.round(parseFloat(c * 255)).toString(16)).join('')}`;
	const rgb2hsv = (r,g,b) => { let v=Math.max(r,g,b), c=v-Math.min(r,g,b), h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c)); return [60*(h<0?h+6:h), (v&&c/v)*100, v*100]}
	const hsvtohsl = (h,s,v,l=v-v*s/2, m=Math.min(l,1-l)) => [h,m?(v-l)/m:0,l];
	const setProperty = (key, value, scope = app) => scope.style.setProperty(key, value);

	const col2hsb = (str) => {
		const d = document.createElement('i');
		document.body.appendChild(d);
		d.style.color = str;
		const [r,g,b] = rgb2arr(window.getComputedStyle(d).color).map(a => a > 0 ? a/255 : 0);
		d.remove();
		return rgb2hsv(r,g,b);
	}

	const setColor = (obj) => {
		const a = getComputedStyle(app).getPropertyValue("--a").trim();
		const hue = getComputedStyle(app).getPropertyValue("--hue").trim()
		let H, s, l; /* H is not used, but returned from `hsvtohsl`-method */

		if (obj) { /* Event triggered from xypad, update `--s` and `--l` */
			[H, s, l] = hsvtohsl(0, obj.x/100, obj.y/100);
			s = `${(s*100).toFixed(2)}%`;
			l = `${(l*100).toFixed(2)}%`;
			setProperty('--s', s);
			setProperty('--l', l);
		}
		else { /* Event triggered from hue or alpha sliders */
			s = getComputedStyle(app).getPropertyValue("--s");
			l = getComputedStyle(app).getPropertyValue("--l");
		}
		/* Update color-codes */
		/* TODO: SET AS VALUE IN GROUP!!! */
		app.elements.cpRGB.innerText = getComputedStyle(app.elements.cpPreview).backgroundColor;
		app.elements.cpHSL.innerText = `hsla(${hue}°, ${s}, ${l}, ${a})`;
		app.elements.cpHEX.innerText = rgb2hex(app.elements.cpRGB.innerText);
		
		settings.scope.dispatchEvent(new CustomEvent('color', { detail: { color: 'test'}}));
	}
	/* Init */
	app.addEventListener('input', (e) => { 
		const input = e.target;
		switch(input.name) {
			case 'cpAlpha': setProperty('--a', input.valueAsNumber); setColor(); break;
			case 'cpHue': setProperty('--hue', input.valueAsNumber); setColor(); break;
		}
	});

	/* Copy to clipboard */
		app.elements.cpPreview.addEventListener('click', () => {
		app.elements.cpClipboard.value = '#AA0033'; /* TODO: FROM SELECTED radio-group */
		app.elements.cpClipboard.select();
		// document.execCommand('copy');
	})

	app.addEventListener('xymove', (e) => setColor(e.detail));
	/* TODO: SET FROM COLOR, calc x and y */

	const [h,s,b] = col2hsb(settings.color || 'red');
	app.elements.cpHue.value = h;
	setProperty('--hue', h);
	
	xy(app.elements.cpBackground, { eventScope: app, x:s, y:b });
}