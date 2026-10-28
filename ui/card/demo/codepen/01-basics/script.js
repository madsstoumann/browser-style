/*
 * CSS Carousels — fallback controls (Pen 01's JS panel)
 *
 * The demos need NO JavaScript: without it, every carousel is still a
 * swipeable scroll-snap row. This script only runs where the browser can't
 * draw ::scroll-marker / ::scroll-button() (Safari, Firefox — Oct 2026), and
 * adds real <button> dots and arrows instead.
 *
 * Other pens: add this pen's JS as an external script.
 * Test the fallback in Chrome by adding ?polyfill to the URL.
 */
const forced = new URLSearchParams(location.search).has('polyfill');

if (forced || !CSS.supports('scroll-marker-group: after')) {
	/* forced in a supporting browser: switch the native controls off */
	if (forced) {
		document.head.insertAdjacentHTML('beforeend', `<style>
			.carousel { scroll-marker-group: none !important; }
			.carousel::scroll-button(*) { content: none !important; }
		</style>`);
	}

	/* The tokens (--dot-size, --arrow-bg …) are set on .carousel. The fallback
	   buttons sit OUTSIDE it, so copy every custom property across. A slide's
	   own tokens (--thumb, per-slide dot colours) go onto its dot. */
	const copyTokens = (from, to, onlyOwn = false) => {
		const cs = getComputedStyle(from);
		const parent = onlyOwn ? getComputedStyle(from.parentElement) : null;
		[...cs].filter(name => name.startsWith('--')).forEach(name => {
			const value = cs.getPropertyValue(name).trim();
			if (value && (!parent || parent.getPropertyValue(name).trim() !== value)) to.style.setProperty(name, value);
		});
	};

	const button = (className, label) => {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = className;
		btn.setAttribute('aria-label', label);
		return btn;
	};

	const init = carousel => {
		if (carousel.matches('.no-dots.no-arrows')) return;
		const vertical = getComputedStyle(carousel).scrollSnapType.startsWith('y');
		const wrap = document.createElement('div');
		wrap.className = `carousel-polyfill ${carousel.className.replace(/\bcarousel\b\s*/, '')}`.trim();
		if (vertical) wrap.classList.add('is-vertical');
		carousel.before(wrap);
		wrap.append(carousel);
		copyTokens(carousel, wrap);

		const start = vertical ? 'top' : 'left';
		const size = vertical ? 'clientHeight' : 'clientWidth';
		const pos = () => Math.abs(vertical ? carousel.scrollTop : carousel.scrollLeft);
		const max = () => vertical
			? carousel.scrollHeight - carousel.clientHeight
			: carousel.scrollWidth - carousel.clientWidth;
		const rtl = !vertical && getComputedStyle(carousel).direction === 'rtl';

		/* arrows */
		let prev, next;
		if (!carousel.classList.contains('no-arrows')) {
			prev = button('carousel-arrow', 'Previous');
			next = button('carousel-arrow', 'Next');
			prev.dataset.dir = 'prev';
			next.dataset.dir = 'next';
			prev.addEventListener('click', () => carousel.scrollBy({ [start]: -carousel[size] * (rtl ? -1 : 1) }));
			next.addEventListener('click', () => carousel.scrollBy({ [start]: carousel[size] * (rtl ? -1 : 1) }));
			wrap.append(prev, next);
		}

		/* dots — one per slide that is a snap target (paged carousels skip the rest) */
		const wantDots = !carousel.classList.contains('no-dots');
		const group = document.createElement('div');
		group.className = 'carousel-dots';
		let dots = [], slides = [];
		const build = () => {
			slides = [...carousel.children].filter(slide =>
				slide.offsetParent !== null && getComputedStyle(slide).scrollSnapAlign !== 'none');
			if (!wantDots) return;
			group.replaceChildren();
			dots = slides.map((slide, index) => {
				const label = slide.getAttribute('aria-label') || slide.getAttribute('alt') || `Slide ${index + 1}`;
				const dot = button('carousel-dot', label);
				const text = slide.dataset.label || slide.dataset.date;
				if (text) dot.textContent = text;
				copyTokens(slide, dot, true);
				dot.addEventListener('click', () => carousel.scrollBy({ [start]: offset(slide) }));
				group.append(dot);
				return dot;
			});
		};
		/* how far a slide is from its snap position: start edges, or centres */
		const offset = slide => {
			const s = slide.getBoundingClientRect(), c = carousel.getBoundingClientRect();
			const centred = getComputedStyle(slide).scrollSnapAlign.includes('center');
			const edge = vertical ? 'top' : 'left', length = vertical ? 'height' : 'width';
			const scrollPadding = parseFloat(getComputedStyle(carousel)[vertical ? 'scrollPaddingTop' : 'scrollPaddingLeft']) || 0;
			return centred
				? (s[edge] + s[length] / 2) - (c[edge] + c[length] / 2)
				: s[edge] - c[edge] - scrollPadding;
		};
		build();
		if (wantDots) wrap.append(group);
		/* a slide can appear or vanish (see the quiz pen) — rebuild */
		carousel.addEventListener('change', () => requestAnimationFrame(() => { build(); update(); }));

		/* state: current dot + slide, disabled arrows */
		const update = () => {
			let current = 0, best = Infinity;
			slides.forEach((slide, index) => {
				const distance = Math.abs(offset(slide));
				if (distance < best) { best = distance; current = index; }
			});
			/* scrolled to the very end: the last slide wins, even if it can't reach its snap position */
			if (pos() >= max() - 1) current = slides.length - 1;
			dots.forEach((dot, index) => dot.toggleAttribute('aria-current', index === current));
			/* data-current lets CSS fake the snapped state (see the stagger pen) */
			slides.forEach((slide, index) => slide.toggleAttribute('data-current', index === current));
			if (prev) prev.disabled = pos() <= 1;
			if (next) next.disabled = pos() >= max() - 1;
		};
		let frame;
		carousel.addEventListener('scroll', () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(update);
		}, { passive: true });
		new ResizeObserver(update).observe(carousel);
		update();
	};

	document.querySelectorAll('.carousel').forEach(init);
}
