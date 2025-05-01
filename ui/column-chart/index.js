const styles = `
:host {
  --column-chart-bar-bdrs: clamp(0.125rem, -0.35rem + 1cqi, 0.33rem);
  --column-chart-bar-c: currentColor;
  --column-chart-bdw: 1px;
  --column-chart-bds: solid;
  --column-chart-bdc: #CCC;
  --column-chart-light-bdw: 1px;
  --column-chart-light-bds: solid;
  --column-chart-light-bdc: #EBEBEB;

  --column-chart-caption-h: 1.5rem;
  --column-chart-label-h: 20px;
  --column-chart-mih: 275px;
  --column-chart-y-axis-w: 1.5rem;

  --_min: attr(min type(<number>), 0);
  --_max: attr(max type(<number>), 100);
  --_sm: attr(small type(<number>), 0);
  --_md: attr(medium type(<number>), 0);

  background: var(--column-chart-bg, #FFF0);
  border-radius: var(--column-chart-bdrs, .5rem);
	box-sizing: border-box;
  container-type: inline-size;
  display: block;
  font-family: var(--column-chart-ff, ui-sans-serif, system-ui);
  padding: var(--column-chart-p, 0);
}

:host * {
	box-sizing: border-box;
}

caption {
  display: none;
  font-size: var(--column-chart-caption-fs, 11px);
  font-weight: var(--column-chart-caption-fw, 500);
  grid-area: 1 / 1 / 2 / 2;
  text-wrap: nowrap;
}

table {
  display: grid;
  grid-template-rows: var(--_gtr, var(--column-chart-caption-h) 1fr);
  min-height: var(--column-chart-mih);
}

tbody {
  container-type: size;
  display: grid;
  gap: var(--column-chart-bar-gap, .25rem);
  grid-area: 2 / 1 / 4 / 2;
  grid-template-columns: repeat(auto-fit, minmax(var(--column-chart-bar-miw, 1.25cqi), 1fr));

  td {
    --_v: attr(data-v type(<number>), 0);
    background: var(--column-chart-bar-bg, var(--_bg, hsla(210, 100%, 70%, .8)));
    color: #0000;
    font-size: var(--column-chart-bar-fs, clamp(0.5625rem, 0.45rem + .5cqi, 0.75rem));
    font-weight: var(--column-chart-bar-fw, 400);
    height: calc(
      (
        (var(--_v) - var(--_min)) / (var(--_max) - var(--_min))
      ) * 100cqb
    );
    padding: var(--column-chart-bar-p, .75ch 0 0 0);
    text-align: center;
    &:first-of-type {
      border-radius: var(--column-chart-bar-bdrs) var(--column-chart-bar-bdrs) 0 0;
    }
  }

  th {
    border-block-start: var(--column-chart-x-axis-bdw, 0px) var(--column-chart-x-axis-bds, solid) var(--column-chart-x-axis-bdc, hsla(0, 0%, 41%, .95));
    color: var(--column-chart-x-axis-c, #444);
    display: none;
    font-size: var(--column-chart-x-axis-fs, clamp(0.5625rem, 0.4rem + .5cqi, 0.6875rem));
    font-weight: var(--column-chart-x-axis-fw, 400);
    grid-row: calc(var(--_c, 1) + 1);
    height: var(--column-chart-label-h);
    overflow-inline: clip;
    place-content: center;
  }

  tr {
    /* Count children. Each <tr> has one <th> and one <td> by default: --_c: 1; */
    &:has(> td:nth-child(3)) { --_c: 2; }
    &:has(> td:nth-child(4)) { --_c: 3; }
    &:has(> td:nth-child(5)) { --_c: 4; }
    &:has(> td:nth-child(6)) { --_c: 5; }
    &:has(> td:nth-child(7)) { --_c: 6; }
    &:has(> td:nth-child(8)) { --_c: 7; }
    &:has(> td:nth-child(9)) { --_c: 8; }
    align-content: end;
    align-items: end;
    display: grid;
    overflow-inline: clip;
  }
}

thead {
  align-items: end;
  color: #0000;
  display: none;
  grid-area: 1 / 1 / 3 / 2;
  grid-template-rows: var(--column-chart-caption-h) repeat(auto-fit, minmax(1rem, 1fr));

  th {
    font-size: var(--column-chart-y-axis-fs, 10px);
    font-weight: var(--column-chart-y-axis-fw, 300);
    text-align: start;
  }
  tr {
    display: contents;
  }
}

/* === Modifiers === */
:host([display*="caption"]) {
  caption { display: block; }
}
:host([display~="caption-end"]) {
  caption { text-align: end; }
}
:host([display~="caption-start"]) {
  caption { text-align: start; }
}
:host([display~="groups"]) {
  tbody {
    --column-chart-bar-bdrs: 0;
    th { grid-column: span var(--_c, 1); }
    tr { grid-template-columns: repeat(auto-fit, minmax(var(--chart-group-bar-miw, 2px), 1fr)); }
  }
}
:host([display*="value-labels"]) {
  td { color: var(--column-chart-bar-c); }
}
:host([display~="value-labels-center"]) {
  td { align-content: center; }
}
:host([display~="value-labels-end"]) {
  td { align-content: end; }
}
:host([display~="x-grid"]) {
  --column-chart-bar-gap: 0;
  tr {
    border-block-end: var(--column-chart-light-bdw) var(--column-chart-light-bds) var(--column-chart-light-bdc);
    border-inline-end: var(--column-chart-light-bdw) var(--column-chart-light-bds) var(--column-chart-light-bdc);
    &:first-of-type {
      border-inline-start: var(--column-chart-light-bdw) var(--column-chart-light-bds) var(--column-chart-light-bdc);
    }
  }
}
:host([display~="x-labels"]) {
  --_gtr: var(--column-chart-caption-h) 1fr var(--column-chart-label-h);
  td {
    height: calc(
      (
        (var(--_v) - var(--_min)) / (var(--_max) - var(--_min))
      ) * 100cqb - var(--column-chart-label-h)
    );
  }
  th { display: inline grid; }
}
:host([display~="y-grid"]) {
  thead {
    display: grid; 
    th {
      border-block-end: var(--column-chart-bdw) var(--column-chart-bds) var(--column-chart-bdc);
      &:empty {
        border-block-end: var(--column-chart-light-bdw) var(--column-chart-light-bds) var(--column-chart-light-bdc);
      }
    }
  }
}
:host([display*="y-labels"]) {
  tbody { padding-inline: var(--column-chart-y-axis-w) 0; }
  thead {
    color: var(--column-chart-y-axis-c, #696969);
    display: grid;
  }
}
:host([display~="y-labels-end"]) {
  tbody { padding-inline: 0 var(--column-chart-y-axis-w); }
  thead th { text-align: end; }
}

/* === Responsive === */
@container (max-width: 400px) {
  :host([small="1"]) { tbody tr:nth-of-type(n+2) { display: none; } }
  :host([small="2"]) { tbody tr:nth-of-type(n+3) { display: none; } }
  :host([small="3"]) { tbody tr:nth-of-type(n+4) { display: none; } }
  :host([small="4"]) { tbody tr:nth-of-type(n+5) { display: none; } }
  :host([small="5"]) { tbody tr:nth-of-type(n+6) { display: none; } }
  :host([small="6"]) { tbody tr:nth-of-type(n+7) { display: none; } }
  :host([small="7"]) { tbody tr:nth-of-type(n+8) { display: none; } }
  :host([small="8"]) { tbody tr:nth-of-type(n+9) { display: none; } }
}

@container (min-width: 400px) and (max-width: 800px) {
  :host([medium="4"]) { tbody tr:nth-of-type(n+5) { display: none; } }
  :host([medium="5"]) { tbody tr:nth-of-type(n+6) { display: none; } }
  :host([medium="6"]) { tbody tr:nth-of-type(n+7) { display: none; } }
  :host([medium="7"]) { tbody tr:nth-of-type(n+8) { display: none; } }
  :host([medium="8"]) { tbody tr:nth-of-type(n+9) { display: none; } }
  :host([medium="9"]) { tbody tr:nth-of-type(n+10) { display: none; } }
  :host([medium="10"]) { tbody tr:nth-of-type(n+11) { display: none; } }
  :host([medium="11"]) { tbody tr:nth-of-type(n+12) { display: none; } }
  :host([medium="12"]) { tbody tr:nth-of-type(n+13) { display: none; } }
}

/* === Colors === */
tbody {
  tr:nth-of-type(10n+1) td { --_bg: var(--c1); }
  tr:nth-of-type(10n+2) td { --_bg: var(--c2); }
  tr:nth-of-type(10n+3) td { --_bg: var(--c3); }
  tr:nth-of-type(10n+4) td { --_bg: var(--c4); }
  tr:nth-of-type(10n+5) td { --_bg: var(--c5); }
  tr:nth-of-type(10n+6) td { --_bg: var(--c6); }
  tr:nth-of-type(10n+7) td { --_bg: var(--c7); }
  tr:nth-of-type(10n+8) td { --_bg: var(--c8); }
  tr:nth-of-type(10n+9) td { --_bg: var(--c9); }
  tr:nth-of-type(10n+0) td { --_bg: var(--c10); }
}
`;

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class ColumnChart extends HTMLElement {
	#dataset; #root;
	#resizeObserver;

	constructor() { super(); }

	#isAdvancedAttrSupported() {
		const T = document.createElement('div');
		document.body.appendChild(T);
		
		try {
			T.style.setProperty('--t', 'attr(data-test type(<number>), 0)');
			T.dataset.test = "123";
	
			const computedValue = getComputedStyle(T)
				.getPropertyValue('--t')
				.trim();
			
			return computedValue === "123";
		} catch (e) {
			return false;
		} finally {
			T.remove();
		}
	}

	static get observedAttributes() { return ['data']; }

	get dataset() { return this.#dataset; }
	get settings() { return this.#dataset?.settings; }
	get data() { return this.#dataset?.data; }

	set dataset(newData) {
		this.#dataset = newData;
		this.render();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'data' && oldValue !== newValue) this.load(newValue);
	}

	connectedCallback() {
		this.#root = this.attachShadow({ mode: 'open' });
		this.#root.adoptedStyleSheets = [sheet];
		if (!this.hasAttribute('data')) this.render();
	}

	async load(source) {
		try {
			const trimmed = source.trim();
			this.#dataset =
				(['{', '['].includes(trimmed[0]) && ['}', ']'].includes(trimmed.at(-1)))
					? JSON.parse(trimmed)
					: await (await fetch(trimmed)).json();
		} catch {
			this.#dataset = null;
		} finally {
			this.render();
		}
	}

	render() {
		if (!this.#dataset || !this.data) {
			this.#root.innerHTML = '';
			return;
		}

		this.setAttribute('max', this.settings?.max ?? 100);
		this.setAttribute('min', this.settings?.min ?? 0);

		const getStyleAttr = (styles, index = 0) => {
			if (!styles) return '';
			if (typeof styles === 'string') return ` style="${styles}"`;
			if (Array.isArray(styles) && styles.length > index) return ` style="${styles[index]}"`;
			return '';
		};

		const maxColspan = Math.max(...this.data.map(item => 
			1 + (Array.isArray(item.value) ? item.value.length : 1)
		));

		const yAxisData = [...(this.settings?.yAxis || [])];
		if (!this.hasAttribute('reverse')) {
			yAxisData.reverse();
		}

		this.#root.innerHTML = `
		<table>
			${this.settings?.caption ? `<caption>${this.settings.caption}</caption>` : ''}
			<thead>
				${yAxisData.map(x => `<tr><th colspan="${maxColspan}">${x}</th></tr>`).join('')}
			</thead>
			<tbody>
				${this.data.map(item => {
					// Generate td elements
					const tdElements = Array.isArray(item.value) 
						? item.value.map((v, index) => 
							`<td data-v="${v}"${getStyleAttr(item.styles, index)}>${v}</td>`
						).join('')
						: `<td data-v="${item.value}"${getStyleAttr(item.styles)}">${item.value}</td>`;
						
					return `
					<tr>
						<th scope="row">${item.label || ''}</th>
						${tdElements}
					</tr>`;
				}).join('')}
			</tbody>
		</table>`;
		
		// Apply polyfill for browsers without advanced attribute support
		if (!this.#isAdvancedAttrSupported()) {
			this.#applyAdvancedAttrPolyfill();
		}
	}

	/* Only for Safari */
	#applyAdvancedAttrPolyfill() {
		console.warn('Polyfilling advanced attribute support for ColumnChart'); 
		const tds = this.#root.querySelectorAll('[data-v]');
		tds.forEach(td => {
			td.style.setProperty('--_v', td.getAttribute('data-v'));
		});

		const tbody = this.#root.querySelector('tbody');
		if (tbody) {
			const host = this;
			let numCols;
			if (host.hasAttribute('small')) {
				const smallVal = parseInt(host.getAttribute('small'), 10);
				if (!isNaN(smallVal) && smallVal > 0) {
					numCols = smallVal;
				}
			} else if (host.hasAttribute('medium')) {
				const mediumVal = parseInt(host.getAttribute('medium'), 10);
				if (!isNaN(mediumVal) && mediumVal > 0) {
					numCols = mediumVal;
				}
			}
			if (!numCols) {
				numCols = tbody.querySelectorAll('tr').length;
			}
			tbody.style.setProperty('--_min', this.getAttribute('min'));
			tbody.style.setProperty('--_max', this.getAttribute('max'));
			tbody.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;

			// Setup ResizeObserver if small/medium attribute exists
			const needsObserver = host.hasAttribute('small') || host.hasAttribute('medium');
			if (needsObserver && !this.#resizeObserver) {
				this.#resizeObserver = new ResizeObserver(entries => {
					const width = entries[0].contentRect.width;
					let newNumCols;
					// Use >= and < for clear boundaries, matching CSS container queries
					if (host.hasAttribute('small') && width < 400) {
						const smallVal = parseInt(host.getAttribute('small'), 10);
						if (!isNaN(smallVal) && smallVal > 0) {
							newNumCols = smallVal;
						}
					} else if (host.hasAttribute('medium') && width >= 400 && width < 815) {
						const mediumVal = parseInt(host.getAttribute('medium'), 10);
						if (!isNaN(mediumVal) && mediumVal > 0) {
							newNumCols = mediumVal;
						}
					} else {
						newNumCols = tbody.querySelectorAll('tr').length;
					}
					tbody.style.gridTemplateColumns = `repeat(${newNumCols}, 1fr)`;
				});
				this.#resizeObserver.observe(this);
			} else if (!needsObserver && this.#resizeObserver) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
		}
	}
}

customElements.define('column-chart', ColumnChart);
