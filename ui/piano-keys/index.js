/**
 * PianoKeys
 * @version 1.0.00
 * @summary 25-04-2024
 * @author Mads Stoumann
 * @description Piano
 */
class pianoKeys extends HTMLElement {
	static observedAttributes = ['chord'];
	constructor() {
		super();
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
		const keys = parseInt(this.getAttribute('keys'), 10) || 61;
		const startNote = this.getAttribute('startnote') || 'C2';
		const index = this.calculateNoteIndex(startNote);
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
		const offsets = chord.split(',').map(item => parseFloat(item));
		const key = this.getAttribute('chordkey');
		if (key) {
			const elements = Array.from(this.form.elements);
			const base = elements.findIndex(element => element.name === key);
			if (base !== -1) {
				elements[base].classList.add('chord');
				offsets.forEach(offset => {
					const index = base + offset;
					if (index < elements.length) {
						elements[index].classList.add('chord');
					}
				});
			}
		}
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
		&:hover {
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
	}
`)
customElements.define('ui-piano-keys', pianoKeys);