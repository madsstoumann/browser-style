/**
 * @function addDocumentScroll
 * @param {Function} callback
 * @version 2.0.15
 * @summary 03-27-2022
 * @description Adds a scroll-listener to documentElement, adding three custom CSS-props while scrolling:
 * --scroll-d Boolean indicating scroll direction: 1 (down), 0 (up). To simulate `not`, use: --top: calc(1 - var(--scroll-d));
 * --scroll-p Current vertical scroll position in percent (deducting innerHeight from scrollHeight)
 * --scroll-v Velocity, pixels scrolled since last scroll event.
 * --scroll-y Current vertical scroll position in absolute unit (pixels)
 */
export function addDocumentScroll(settings = {
	callback: undefined,
	direction: false,
	percentage: true,
	velocity: false
	}) {
	let ticking = false;
	let scrollYcur = 0;
	let scrollY = 0;
	window.addEventListener('scroll', () => {
	scrollY = window.scrollY;
	/* Prevent a negative scroll-value (on iOS):  */
	if (scrollY < 0) { scrollY = 0; }

	if (!ticking) {
		window.requestAnimationFrame(() => {
			document.body.style.setProperty('--scroll-y', scrollY);
			if (settings.direction) document.body.style.setProperty('--scroll-d', scrollYcur < scrollY ? 1 : 0);
			if (settings.percentage) document.body.style.setProperty('--scroll-p', `${(scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`);
			if (settings.velocity) document.body.style.setProperty('--scroll-v', Math.abs(scrollY - scrollYcur));
			if (typeof settings.callback === 'function') settings.callback();
			scrollYcur = scrollY;
			ticking = false;
		});
		ticking = true;
	}
	})
}