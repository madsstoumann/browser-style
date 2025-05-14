const i18n = {
	defaultLang: 'en',
	currentGlobalLang: null,
	translations: {
		en: {
			string: 'String',
			fret: 'Fret',
			finger: 'Finger',
			barre: 'Barre',
			open: 'open',
			muted: 'muted',
			chord: 'Chord',
			fretboard: 'Fretboard',
			from: 'from',
			to: 'to',
		},
		zh: {
			string: '弦',
			fret: '品',
			finger: '指',
			barre: '横按',
			open: '空弦',
			muted: '闷音',
			chord: '和弦',
			fretboard: '指板',
			from: '从',
			to: '到',
		},
		es: {
			string: 'Cuerda',
			fret: 'Traste',
			finger: 'Dedo',
			barre: 'Cejilla',
			open: 'al aire',
			muted: 'apagada',
			chord: 'Acorde',
			fretboard: 'Diapasón',
			from: 'de',
			to: 'a',
		},
		ar: {
			string: 'وتر',
			fret: 'موضع',
			finger: 'إصبع',
			barre: 'بار',
			open: 'مفتوح',
			muted: 'مكتوم',
			chord: 'وتر',
			fretboard: 'لوحة الفريتات',
			from: 'من',
			to: 'إلى',
		},
		fr: {
			string: 'Corde',
			fret: 'Frette',
			finger: 'Doigt',
			barre: 'Barré',
			open: 'à vide',
			muted: 'étouffée',
			chord: 'Accord',
			fretboard: 'Manche',
			from: 'de',
			to: 'à',
		},

	},

	setLang(langCode) {
		const baseLang = langCode ? langCode.split('-')[0] : null;
		if (baseLang && this.translations[baseLang]) {
			this.currentGlobalLang = baseLang;
		} else if (langCode) {
			console.warn(`[i18n] Language "${langCode}" not supported for global setting.`);
		} else {
			this.currentGlobalLang = null;
		}
	},

	get(key, specificLang) {
		const langsToTry = [
			this.currentGlobalLang,
			specificLang,
			this.defaultLang
		].filter(Boolean);

		for (const lang of langsToTry) {
			const baseLang = lang.split('-')[0];
			if (this.translations[baseLang] && this.translations[baseLang][key]) {
				return this.translations[baseLang][key];
			}
		}
		if (this.defaultLang !== 'en' && this.translations.en && this.translations.en[key]) {
			return this.translations.en[key];
		}
		return key;
	},

	determineEffectiveLang(componentLangAttr, documentLangAttr) {
		let lang = this.defaultLang;
		const sources = [componentLangAttr, documentLangAttr, typeof navigator !== 'undefined' ? navigator.language : null];
		for (const sourceLang of sources) {
			if (sourceLang) {
				const baseLang = sourceLang.split('-')[0];
				if (this.translations[baseLang]) {
					lang = baseLang;
					break; 
				}
			}
		}
		return lang;
	}
};

const styles = `
:host {
	--fret-board-bg: light-dark(#EEE, #333);
	--fret-board-fret-c: light-dark(#000, #FFF);
	--fret-board-fret-w: clamp(0.0625rem, 0.03125rem + 0.5cqi, 0.5rem);
	--fret-board-string-c: light-dark(#0008, #FFF8);
	--fret-board-string-w: clamp(0.0625rem, 0.03125rem + 0.5cqi, 0.125rem);

	/* from attr() */
	--_frets: attr(frets type(<number>), 4);
	--_strings: attr(strings type(<number>), 6);

	aspect-ratio: 1 / 1;
	background-color: var(--fret-board-bg);
	border-radius: var(--fret-board-bdrs, .5rem);
	box-sizing: border-box;
	container-type: inline-size;
	direction: ltr;
	display: grid;
	font-family: var(--fret-board-ff, inherit);
	/* Fallback values (e.g., 6, 4) used if --_strings/--_frets are not set */
	grid-template-columns: repeat(calc(var(--_strings, 6) * 2), 1fr);
	grid-template-rows:
		var(--fret-board-top-row-h, 12%)
		repeat(calc(var(--_frets, 4)), 1fr)
		var(--fret-board-bottom-row-h, 15%);
	place-items: center;
}

:host::before { /* Grid Lines (frets and strings) */
	background-color: var(--fret-board-fret-bg, #0000);
	background-image:
		linear-gradient(90deg, var(--fret-board-string-c) var(--fret-board-string-w), #0000 0 var(--fret-board-string-w)),
		linear-gradient(180deg,  var(--fret-board-fret-c) var(--fret-board-fret-w), #0000 0 var(--fret-board-fret-w));
	background-position: 0 var(--fret-board-fret-w), 0 0;
	background-repeat: repeat-x, repeat-y;
	background-size:
		calc(100% / (var(--_strings, 6) - 1) - (var(--fret-board-string-w) / var(--_strings, 6))) calc(100% - (2 * var(--fret-board-fret-w))),
		100% calc(100% / var(--_frets, 4) - (var(--fret-board-fret-w) / var(--_frets, 4)));
	box-shadow: 0 calc(0px - var(--fred-board-fret-bbsw, 1.5cqi)) 0 0 var(--fret-board-fret-c);
	content: '';
	display: block;
	grid-area: 2 / 2 / calc(var(--_frets, 4) + 2) / calc(var(--_strings, 6) * 2);
	height: 100%;
	width: 100%;
}

/* Chord */
:host::part(chord) { 
	color: var(--fret-board-chord-c, light-dark(#222, #FFF));
	cursor: help;
	font-size: var(--fret-board-chord-fs, 7.5cqi);
	font-weight: var(--fret-board-chord-fw, 500);
	grid-column: 2 / span calc((var(--_strings, 6) * 2) - 2);
	grid-row: calc(var(--_frets, 4) + 2);
	position: relative;
	text-align: center;
	user-select: none;
	width: 100%;
}
:host::part(chord-info) { /* Chord Info */
	background-color: var(--fret-board-chord-info-bg, light-dark(#444, #FFF));
	border-radius: var(--fret-board-chord-info-bdrs, .5rem);
	box-sizing: border-box;
	color: var(--fret-board-chord-info-c, light-dark(#FFF, #444));
	font-size: small;
	isolation: isolate;
	left: 0;
	padding: 1ch;
	position: absolute;
	top: 100%;
	width: 100%;
	z-index: 1;
}
[part~="chord-name"]::marker {
	content: "";
}

::slotted(ol) { /* Fret Number (optional) */
	align-items: center;
	display: grid;
	font-size: var(--fret-board-fret-number-fs, 5cqi);
	font-weight: var(--fret-board-fret-number-fw, 400);
	grid-column: 1;
	grid-row: 2 / span var(--_frets, 4);
	grid-template-rows: repeat(var(--_frets, 4), 1fr);
	height: 100%;
	list-style-position: inside;
	padding: 0;
	margin: 0;
}

:host([left-handed]) {
	direction: rtl;
}

/* string-note styles, targeting slotted elements */
::slotted(string-note) {
	--string-note-h: 12cqi;
	--string-note-open-mute-h: 5cqi;

	/* from attr() */
	--barre: attr(barre type(<number>), 1);
	--fret:  attr(fret type(<number>), 0);
	--string:  attr(string type(<number>), 0);

	aspect-ratio: 1;
	background-color: var(--string-note-bg, currentColor);
	border-radius: 50%; 
	box-sizing: border-box;
	display: grid;
	grid-column: calc((var(--_strings, 6) * 2) - (var(--string, 0) * 2 - 1)) / span calc(var(--barre, 1) * 2);
	grid-row: calc(var(--fret, 0) + 1); 
	height: var(--string-note-h);
	isolation: isolate;
	list-style: none;
	place-content: center;
}

::slotted(string-note)::after {
	color: var(--string-note-c, light-dark(#FFF, #222));
	content: attr(finger);
	font-size: var(--string-note-fs, 7cqi);
	font-weight: var(--string-note-fw, 500);
	text-box: cap alphabetic; /* Kept as per original, browser compatibility may vary */
}

::slotted(string-note[barre]) {
	aspect-ratio: unset;
	border-radius: var(--string-note-h); /* Creates pill shape ends */
	opacity: var(--string-note-barre-o, .6);
	width: 100%;
}

::slotted(string-note[mute]),
::slotted(string-note[open]) {
	background-color: var(--string-note-mute-open-c, light-dark(#222, #FFF));
	height: var(--string-note-open-mute-h);
	width: var(--string-note-open-mute-h);
}

::slotted(string-note[mute]) {
	border-image: conic-gradient(var(--fret-board-bg) 0 0) 50%/calc(50% - 0.25cqi);
	rotate: 45deg;
}

::slotted(string-note[open]) {
	border-radius: 50%;
	mask: radial-gradient(circle farthest-side at center, #0000 calc(100% - 1cqi), #000 calc(100% - 1cqi + 1px));
}
`;

const FretBoardSheet = new CSSStyleSheet();
FretBoardSheet.replaceSync(styles);

class FretBoard extends HTMLElement {
	constructor() {
		super();
		const chord = this.getAttribute('chord') || '';
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [FretBoardSheet];
		this.shadowRoot.innerHTML = `
			<slot></slot>
			<details part="chord">
				<summary part="chord-name">${chord}</summary>
				<span part="chord-info"></span>
			</details>`;
		this._chordInfo = this.shadowRoot.querySelector('span[part="chord-info"]');
		this._chordName = this.shadowRoot.querySelector('summary[part="chord-name"]');
	}

	connectedCallback() {
		this.componentLang = i18n.determineEffectiveLang(
			this.getAttribute('lang'),
			document.documentElement.lang
		);
		this._initializeCssVariables();
		this._updateAriaLabel();
	}

	_initializeCssVariables(attrSupported = this._isAdvancedAttrSupported()) {
		if (!attrSupported) {
			const frets = this.getAttribute('frets') || '4';
			const strings = this.getAttribute('strings') || '6';
			this.style.setProperty('--_frets', frets);
			this.style.setProperty('--_strings', strings);
		}

		const stringNotes = this.querySelectorAll('string-note');
		stringNotes.forEach(note => {
			if (!attrSupported) {
				note.style.setProperty('--string', note.getAttribute('string') || '0');
				note.style.setProperty('--fret', note.getAttribute('fret') || '0');
				note.style.setProperty('--barre', note.getAttribute('barre') || '1');
			}
			note.setAttribute('aria-hidden', 'true');
		});
	}

	_isAdvancedAttrSupported() {
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

	_updateAriaLabel() {
		const chordAttributeValue = this.getAttribute('chord');
		const lang = this.componentLang;
		const summaryAriaLabel = chordAttributeValue
			? `${i18n.get('chord', lang)}: ${chordAttributeValue}`
			: i18n.get('fretboard', lang);
		this._chordName.setAttribute('aria-label', summaryAriaLabel);

		let label = chordAttributeValue 
			? `${i18n.get('chord', lang)}: ${chordAttributeValue}.` 
			: `${i18n.get('fretboard', lang)}.`;

		const notes = Array.from(this.querySelectorAll('string-note')); 
		
		const fingeredNoteDescriptions = [];
		const nonFingeredNoteItems = [];

		let diagramBaseFret = 0;
		const fretNumberLi = this.querySelector('ol > li:first-child');
		if (fretNumberLi) {
			const liValue = parseInt(fretNumberLi.getAttribute('value'));
			if (!isNaN(liValue) && liValue > 0) {
				diagramBaseFret = liValue;
			}
		}

		notes.forEach(note => {
			const stringAttr = note.getAttribute('string');
			const fretAttr = note.getAttribute('fret');
			const finger = note.getAttribute('finger');
			const isOpen = note.hasAttribute('open');
			const isMuted = note.hasAttribute('mute');
			const barreAttr = note.getAttribute('barre');
			const barreValue = parseInt(barreAttr || '1');
			const stringNo = parseInt(stringAttr);

			if (isOpen) {
				nonFingeredNoteItems.push({
					stringNo: stringNo,
					text: `${i18n.get('string', lang)} ${stringAttr} ${i18n.get('open', lang)}`
				});
			} else if (isMuted) {
				nonFingeredNoteItems.push({
					stringNo: stringNo,
					text: `${i18n.get('string', lang)} ${stringAttr} ${i18n.get('muted', lang)}`
				});
			} else if (finger && fretAttr) {
				const noteFretOnDiagram = parseInt(fretAttr);
				let announcedFret = noteFretOnDiagram;

				if (diagramBaseFret > 0) {
					// If diagram starts at fret X, a note on diagram's 1st fret is X, 2nd is X+1, etc.
					announcedFret = diagramBaseFret + noteFretOnDiagram - 1;
				}

				if (barreValue > 1) {
					const startString = stringNo;
					const endString = startString - barreValue + 1;
					fingeredNoteDescriptions.push(
						`${i18n.get('finger', lang)} ${finger}: ${i18n.get('fret', lang)} ${announcedFret} - ${i18n.get('barre', lang)} ${i18n.get('from', lang)} ${i18n.get('string', lang)} ${startString} ${i18n.get('to', lang)} ${i18n.get('string', lang)} ${endString}`
					);
				} else {
					fingeredNoteDescriptions.push(
						`${i18n.get('finger', lang)} ${finger}: ${i18n.get('fret', lang)} ${announcedFret} - ${i18n.get('string', lang)} ${stringAttr}`
					);
				}
			}
		});

		// Sort non-fingered (open/muted) notes by string number, descending
		nonFingeredNoteItems.sort((a, b) => b.stringNo - a.stringNo);
		const sortedNonFingeredDescriptions = nonFingeredNoteItems.map(item => item.text);

		const allDescriptions = [
			...fingeredNoteDescriptions,
			...sortedNonFingeredDescriptions
		];

		if (allDescriptions.length > 0) {
			label += ' ' + allDescriptions.join('. ') + '.';
		}
		
		this._chordInfo.innerHTML = label.trim();
	}
}

customElements.define('fret-board', FretBoard);