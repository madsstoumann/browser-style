/**
 * PianoKeys
 * @version 1.0.00
 * @summary 26-04-2024
 * @author Mads Stoumann
 * @description Piano
 */
class PianoKeys extends HTMLElement {
	static observedAttributes = ['chord'];
	constructor() {
		super();
		this.chordMap = {
			'': [4, 7],  // Major triad
			'm': [3, 7],  // Minor triad
			'+': [4, 8],  // Augmented triad
			'dim': [3, 6],  // Diminished triad
			'7': [4, 7, 10],  // Dominant seventh
			'maj7': [4, 7, 11],  // Major seventh
			'm(maj7)': [3, 7, 11],  // Minor-major seventh
			'm7': [3, 7, 10],  // Minor seventh
			'+maj7': [4, 8, 11],  // Augmented-major seventh
			'+7': [4, 8, 10],  // Augmented seventh
			'ø7': [3, 6, 10],  // Half-diminished seventh
			'dim7': [3, 6, 9],  // Diminished seventh
			'7♭5': [4, 6, 10],  // Dominant seventh flat five
			'maj9': [4, 7, 11, 14],  // Major ninth
			'9': [4, 7, 10, 14],  // Dominant ninth
			'7♭9': [4, 7, 10, 13],  // Dominant minor ninth
			'm(maj9)': [3, 7, 11, 14],  // Minor-major ninth
			'm9': [3, 7, 10, 14],  // Minor ninth
			'+maj9': [4, 8, 11, 14],  // Augmented major ninth
			'+9': [4, 8, 10, 14],  // Augmented dominant ninth
			'ø9': [3, 6, 10, 14],  // Half-diminished ninth
			'ø♭9': [3, 6, 10, 13],  // Half-diminished minor ninth
			'dim9': [3, 6, 9, 14],  // Diminished ninth
			'dim♭9': [3, 6, 9, 13]  // Diminished minor ninth
	};
		this.notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
		this.attachShadow({ mode: 'open' })
		this.shadowRoot.adoptedStyleSheets = [stylesheet];
		this.render();
		this.form = this.shadowRoot.querySelector('form');
		this.attachEventListeners();
	}

	attachEventListeners() {
		this.form.addEventListener('pointerdown', e => {
			if (e.target.nodeName === 'BUTTON') this.noteOn(e.target);
		});
		this.form.addEventListener('pointerup', e => {
			if (e.target.nodeName === 'BUTTON') this.noteOff(e.target);
		});
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'chord' && newValue !== oldValue) {
			this.updateChord(newValue);
		}
	}

	calculateNoteIndex(note) {
		const regex = /([A-G]#?)(\d+)/;
		const match = note.match(regex);
		if (match) {
			const [_, notePart, octavePart] = match;
			const noteIndex = this.notes.indexOf(notePart);
			const octaveIndex = parseInt(octavePart);
			const stepsFromA4 = 12 * (octaveIndex - 4) + (noteIndex - this.notes.indexOf('A'));
			return stepsFromA4;
		}
		return 0;
	}

	freqs(start, end) {
		let black = 0, white = -2;
		return Array(end - start).fill().map((_, i) => {
			const key = this.getNote(start + i);
			if (i === 0 && key.note === 'C') black = -3;
			key.note.includes("#") ? (black+=3,["C#","F#"].includes(key.note) && (black+=3)) : white+=3;
			key.offset = key.note.includes('#') ? black : white;
			return key;
		})
	}

	getHz(n) {
		return 440 * Math.pow(2, n / 12);
	}

	getNote(n) {
		const key = n % 12;
		const note = this.notes[key >= 0 ? key : 12 + key];
		const octave = Math.floor(4 + n / 12);
		return { freq: this.getHz(n), midi: n + 69, note, octave };
	}

	noteOn(note) {
		this.triggerNoteEvent('noteon', note);
	}

	noteOff(note) {
		this.triggerNoteEvent('noteoff', note);
	}

	render() {
		this.startNote = this.getAttribute('startnote') || 'C2';
		const keys = parseInt(this.getAttribute('keys'), 10) || 61;
		const index = this.calculateNoteIndex(this.startNote);
		const data = this.freqs(index, index + keys);
		const whiteKeys = data.filter(item => !item.note.includes('#')).length;
		this.style.setProperty('--_gtc', whiteKeys * 3);
		this.shadowRoot.innerHTML = `
			<form>
				<strong>${this.getAttribute('label') || ''}</strong>
				<fieldset>${data.map(item => `
					<button name="${item.note}${item.octave}" data-freq="${
						item.freq}" data-midi="${
						item.midi}" style="--gc:${
						item.offset}" type="button"></button>`
				).join('')}</fieldset>
			</form>`;
	}

	triggerNoteEvent(eventName, note) {
		const { name, dataset: { freq, midi } } = note;
		this.dispatchEvent(new CustomEvent(eventName, { detail: { key: name, freq, midi } }));
	}

	updateChord(chord) {
		this.form.querySelectorAll('.chord').forEach(element => element.classList.remove('chord'));
		const rootRegex = /^([A-G]#?)/;
		const rootMatch = chord.match(rootRegex);
		if (!rootMatch) return;
		const root = rootMatch[1];
		const type = chord.slice(root.length);
		const intervals = this.chordMap[type];
		if (!intervals) return;

		// const [startRoot, startOctave] = this.startNote.match(/([A-G]#?|\d+)/g);
		const noteNumber = parseInt(this.startNote.replace(/[^0-9]/g, '')) + 1;
		const base = Array.from(this.form.elements).findIndex(element => element.name === root + noteNumber);
		if (base === -1) return;

		// Add 'chord' class to base and interval-based elements
		Array.from(this.form.elements)[base].classList.add('chord');
		intervals.forEach(offset => {
			const index = base + offset;
			if (index < this.form.elements.length) {
				this.form.elements[index].classList.add('chord');
			}
		});
	}
}

/* === STYLES === */
const stylesheet = new CSSStyleSheet()
stylesheet.replaceSync(`
	fieldset {
		block-size: var(--ui-piano-keys-bs, 7em);
		border: 0;
		border-block-start: var(--ui-piano-keys-b, 4px solid #0004);
		display: grid;
		grid-column-gap: 1px;
		grid-template-columns: repeat(var(--_gtc, 0), 1fr);
		grid-template-rows: repeat(5, 1fr);
		margin: 0;
		padding: 0;
	}
	form {
		background: var(--ui-piano-keys-bg, linear-gradient(185deg, #111, #555, #333));
		border-radius: var(--ui-piano-keys-bdrs, .33em .33em .75em .75em);
		color: var(--ui-piano-keys-c, #FFF);
		inline-size: max-content;
		padding: var(--ui-piano-keys-p, .5em 1em 1em 1em);
	}
	strong {
		display: block;
		font-size: var(--ui-piano-keys-fs, 1.8em);
		line-height: 1;
		margin-block: var(--ui-piano-keys-mb, .25ch .5ch);
		text-transform: uppercase;
	}
	[name] {
		--_hover-bg: linear-gradient(to bottom, #FFF 0%, hsl(0, 0%, 90%) 100%);
		background-color: #FFF;
		border: 0;
		border-radius: 0 0 3px 3px;
		grid-column: var(--gc) / span var(--_cspan, 3);
		grid-row: 1 / span var(--_rspan, 5);
		position: relative;
		&:hover:not(.chord) {
			background: var(--_hover-bg);
		}
	}
	[name*="#"] { 
		--_cspan: 2;
		--_hover-bg: linear-gradient(to top, #000 0%, hsl(0, 0%, 25%) 100%);
		--_rspan: 3;
		background-color: #222;
		z-index: 1;
	}
	.chord {
		background: var(--ui-piano-keys-chord, var(--AccentColor));
		&::after {
			background-color: #FFF;
			block-size: .5em;
			border-radius: 50%;;
			content: "";
			display: block;
			inline-size: .5em;
			inset-block-end: 1em;
			inset-inline-start: 50%;
			position: absolute;
			transform: translateX(-50%);
		}
	}
`)
customElements.define('ui-piano-keys', PianoKeys);