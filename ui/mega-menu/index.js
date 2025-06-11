export default function setupMegaMenu(header, groupSel, panelSel, focusSel) {
	if (!header) return;
	let current = null;
	const clearAttrs = (el) => (
		el.removeAttribute('data-last-typed-char'),
		el.removeAttribute('data-last-typed-index')
	);
	const getElements = (panel) =>
		Array.from(panel.querySelectorAll(focusSel)).filter(
			(el) => el.offsetParent
		);
	const closePanel = (details = current) => {
		if (details) {
			details.open = false;
			details.querySelector('summary')?.focus();
		}
	};
	const focusInPanel = (panel, isLast = false) => {
		const elements = getElements(panel);
		if (elements.length) {
			const target = isLast ? elements[elements.length - 1] : elements[0];
			setTimeout(() => target.focus(), 10);
		}
	};

	const handleKey = (evt) => {
		if (!current?.open) return;
		const panel = current.querySelector(panelSel);
		if (!panel) return;

		const elements = getElements(panel);
		const len = elements.length;

		if (evt.key === 'Escape' || evt.key === 'Tab') {
			closePanel();
			if (evt.key === 'Escape') evt.preventDefault();
			return;
		} else if (
			(evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') &&
			len
		) {
			evt.preventDefault();
			const idx = elements.indexOf(document.activeElement);
			const next =
				evt.key === 'ArrowRight'
					? (idx + 1) % len
					: (idx - 1 + len) % len;
			elements[next].focus();
		} else if ((evt.key === 'Home' || evt.key === 'End') && len) {
			evt.preventDefault();
			elements[evt.key === 'Home' ? 0 : len - 1].focus();
		} else if (
			/^[a-z0-9]$/i.test(evt.key) &&
			!evt.ctrlKey &&
			!evt.altKey &&
			!evt.metaKey
		) {
			evt.preventDefault();
			const char = evt.key.toLowerCase();
			const getText = (el) =>
				(
					el.getAttribute('aria-label') ||
					el.textContent ||
					el.innerText ||
					el.value ||
					el.placeholder ||
					''
				)
					.trim()
					.toLowerCase();
			const matches = elements.filter((el) =>
				getText(el).startsWith(char)
			);

			if (!matches.length) return;

			const { lastTypedChar: last, lastTypedIndex: lastIdx } =
				current.dataset;
			const nextIdx =
				last === char ? ((+lastIdx || 0) + 1) % matches.length : 0;

			matches[nextIdx].focus();
			current.dataset.lastTypedChar = char;
			current.dataset.lastTypedIndex = nextIdx;
		}
	};

	const handleClick = (evt) =>
		current && !header.contains(evt.target) && closePanel();

	const handleMenubarKey = (evt) => {
		if (evt.target.tagName !== 'SUMMARY' || !evt.target.closest(groupSel))
			return;
		if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
			evt.preventDefault();
			const details = evt.target.closest(groupSel);
			details.open = true;
			const panel = details.querySelector(panelSel);
			panel &&
				setTimeout(() => focusInPanel(panel, evt.key === 'ArrowUp'), 10);
		}
	};

	header.addEventListener('keydown', handleMenubarKey);

	header.addEventListener(
		'toggle',
		(evt) => {
			const details = evt.target;
			if (!details.matches(groupSel)) return;

			if (details.open) {
				header
					.querySelectorAll(groupSel)
					.forEach(
						(other) =>
							other !== details &&
							other.open &&
							((other.open = false), clearAttrs(other))
					);
				current = details;
				clearAttrs(current);
				document.addEventListener('keydown', handleKey, true);
				document.addEventListener('click', handleClick, true);

				const panel = details.querySelector(panelSel);
				panel && focusInPanel(panel);
			} else if (current === details) {
				document.removeEventListener('keydown', handleKey, true);
				document.removeEventListener('click', handleClick, true);
				clearAttrs(details);
				current = null;
			}
		},
		true
	);
}