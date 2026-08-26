/**
 * recipe.js — the kitchen-app behaviour for demo/recipes/recipe.html. Page-local, progressive
 * enhancement: the SSR page works without it (checkboxes, native popover, step list).
 * Commands route through ui/common/command.js.
 * Docs: ui/card/docs/schema.md § Recipe
 * @author Mads Stoumann
 */
import { createCommandRouter } from '../../../common/command.js';
import { reflectPlay } from '../../shared.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const article = $('.recipe-page');
const cook = $('#cook');
const steps = $$('#steps > li');
const cookSteps = $$('.cook-steps > li');
const N = steps.length;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const hasTTS = 'speechSynthesis' in window;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

/* ── state (localStorage, namespaced by the ?id= route param) ────────────── */
const id = new URLSearchParams(location.search).get('id') || article?.dataset.id || 'recipe';
const KEY = `recipe:${id}`;
const BASE_SERVINGS = +($('#ingredients')?.dataset.servings || 4);
const state = { step: 0, checked: [], servings: BASE_SERVINGS, units: 'metric' };

function load() {
	try { Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch { /* private mode, quota */ }
	state.step = Math.min(Math.max(state.step | 0, 0), N - 1);
}
function save() {
	try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

/* ── speech helpers (the same expansions build.js writes into narration.md) ── */
const SPEECH_UNITS = { g: 'grams', kg: 'kilograms', ml: 'millilitres', l: 'litres', tsp: 'teaspoons', tbsp: 'tablespoons', oz: 'ounces', lb: 'pounds', 'fl oz': 'fluid ounces' };
const speakable = (str) => str.replace(/(\d+(?:[.,]\d+)?)\s?(fl oz|g|kg|ml|l|tsp|tbsp|oz|lb)\b/g, (m, n, u) => `${n} ${SPEECH_UNITS[u]}`);
const stepText = (i) => `Step ${i + 1}. ${$('h3', steps[i]).textContent}. ${speakable($('p', steps[i]).textContent)}`;
const ingredientsText = () => `You need: ${$$('#ingredients data').map((el) => speakable(el.textContent.trim())).join(', ')}.`;

/* ── steps ──────────────────────────────────────────────────────────────── */
function goto(i, { announce = false, scroll = true } = {}) {
	const next = Math.min(Math.max(i, 0), N - 1);
	if (next !== state.step) stopStep();
	state.step = next;
	for (const list of [steps, cookSteps]) {
		list.forEach((li, n) => n === next ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current'));
	}
	for (const out of $$('#step-now, #cook-now')) out.value = next + 1;
	const bar = $('#cook-bar');
	if (bar) bar.value = next + 1;
	for (const b of $$('button[command="--prev-step"]')) b.disabled = next === 0;
	for (const b of $$('button[command="--next-step"]')) b.disabled = next === N - 1;
	if (scroll && !cook.matches(':popover-open')) {
		steps[next].scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
	}
	save();
	if (announce) playStep();
}

/* ── quantities: servings scale + metric/imperial ──────────────────────── */
const FRACTIONS = [[0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1 / 3, '⅓'], [2 / 3, '⅔']];
function formatQty(n) {
	if (!Number.isFinite(n)) return '';
	const whole = Math.floor(n), frac = n - whole;
	const glyph = FRACTIONS.find(([v]) => Math.abs(frac - v) < 0.02)?.[1];
	if (glyph) return whole ? `${whole} ${glyph}` : glyph;
	return String(Math.round(n * 10) / 10);
}
const IMPERIAL = {
	g: (n) => [n / 28.3495, 'oz'],
	kg: (n) => [n / 0.453592, 'lb'],
	ml: (n) => [n / 29.5735, 'fl oz'],
	l: (n) => [n / 0.946353, 'qt'],
	'°C': (n) => [Math.round((n * 9 / 5 + 32) / 5) * 5, '°F'],
	cm: (n) => [n / 2.54, 'in']
};
function measure(el) {
	const base = +el.dataset.qty;
	const baseHi = el.dataset.qtyHi ? +el.dataset.qtyHi : null;
	const unit = el.dataset.unit || '';
	const factor = el.hasAttribute('data-fixed') ? 1 : state.servings / BASE_SERVINGS;
	let lo = base * factor, hi = baseHi == null ? null : baseHi * factor, shown = unit;
	if (state.units === 'imperial' && IMPERIAL[unit]) {
		[lo, shown] = IMPERIAL[unit](lo);
		if (hi != null) [hi] = IMPERIAL[unit](hi);
	}
	el.textContent = `${formatQty(lo)}${hi != null ? `–${formatQty(hi)}` : ''}${shown ? ` ${shown}` : ''}`;
}
function renderMeasures() {
	$$('[data-qty]').forEach(measure);
	const out = $('#servings');
	if (out) out.value = state.servings;
	for (const b of $$('button[command="--toggle-units"]')) {
		b.setAttribute('aria-pressed', String(state.units === 'imperial'));
		b.textContent = state.units === 'imperial' ? 'Metric' : 'Imperial';
	}
}
function setServings(n) {
	state.servings = Math.min(Math.max(n, 1), 24);
	renderMeasures();
	save();
}

/* ── checklist ──────────────────────────────────────────────────────────── */
function applyChecked() {
	for (const box of $$('#ingredients input[type="checkbox"]')) box.checked = state.checked.includes(+box.dataset.ingredient);
}
document.addEventListener('change', (e) => {
	const box = e.target.closest?.('#ingredients input[type="checkbox"]');
	if (!box) return;
	const n = +box.dataset.ingredient;
	state.checked = box.checked ? [...new Set([...state.checked, n])] : state.checked.filter((x) => x !== n);
	save();
});

/* ── timers: wall-clock, concurrent, one ticker ─────────────────────────── */
const timers = new Map();
let ticker = null;
let audioCtx = null;
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
const timerLabel = (ms) => { const m = Math.round(ms / 60000); return m ? `${m} min` : `${Math.round(ms / 1000)} s`; };
const timerButtons = (step) => $$(`[data-timer][data-step="${step}"]`);
const stepName = (step) => $('h3', steps[step - 1])?.textContent || `step ${step}`;

function resetTimer(step) {
	timers.delete(step);
	for (const b of timerButtons(step)) {
		b.removeAttribute('data-running');
		b.removeAttribute('data-done');
		$('[data-label]', b).textContent = timerLabel(+b.dataset.ms);
		b.setAttribute('aria-label', `Start a ${timerLabel(+b.dataset.ms)} timer for ${stepName(step)}`);
	}
}
function startTimer(btn) {
	const step = +btn.dataset.step;
	if (timers.has(step) || btn.hasAttribute('data-done')) { resetTimer(step); return; }
	audioCtx ??= new (window.AudioContext || window.webkitAudioContext)(); /* inside the gesture: autoplay policy */
	timers.set(step, { endAt: Date.now() + +btn.dataset.ms });
	for (const b of timerButtons(step)) {
		b.setAttribute('data-running', '');
		b.setAttribute('aria-label', `Cancel the timer for ${stepName(step)}`);
	}
	tick();
	ticker ??= setInterval(tick, 250);
}
function tick() {
	const now = Date.now();
	for (const [step, t] of timers) {
		const left = Math.max(0, t.endAt - now);
		for (const b of timerButtons(step)) $('[data-label]', b).textContent = mmss(left);
		if (left === 0) {
			timers.delete(step);
			for (const b of timerButtons(step)) {
				b.removeAttribute('data-running');
				b.setAttribute('data-done', '');
				$('[data-label]', b).textContent = 'Done';
				b.setAttribute('aria-label', `Timer done for ${stepName(step)} — clear`);
			}
			chime();
			status(`Timer done: ${stepName(step)}`);
		}
	}
	if (!timers.size && ticker) { clearInterval(ticker); ticker = null; }
}
/* C5 · E5 · G5 — three sines, staggered, exponential fade. No asset to ship. */
function chime() {
	if (!audioCtx) return;
	[523.25, 659.25, 783.99].forEach((hz, i) => {
		const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
		const at = audioCtx.currentTime + i * 0.18;
		osc.type = 'sine';
		osc.frequency.value = hz;
		gain.gain.setValueAtTime(0.25, at);
		gain.gain.exponentialRampToValueAtTime(0.001, at + 0.7);
		osc.connect(gain).connect(audioCtx.destination);
		osc.start(at);
		osc.stop(at + 0.7);
	});
}

/* ── wake lock: intent (toggle) and sentinel (indicator) kept apart ─────── */
const wake = { want: false, sentinel: null };
function paintWake(on) {
	for (const beacon of $$('#wake-state, #cook-wake')) {
		beacon.setAttribute('theme', on ? 'green' : 'gray');
		on ? beacon.setAttribute('animation', 'pulse') : beacon.removeAttribute('animation');
		beacon.textContent = on ? 'Screen awake' : 'Screen may sleep';
	}
}
function paintWakeIntent() {
	for (const b of $$('button[command="--toggle-wake"]')) b.setAttribute('aria-pressed', String(wake.want));
}
async function syncWakeLock() {
	if (!('wakeLock' in navigator)) return;
	const want = wake.want && document.visibilityState === 'visible';
	if (want && !wake.sentinel) {
		try {
			const sentinel = await navigator.wakeLock.request('screen');
			wake.sentinel = sentinel;
			paintWake(true);
			/* the UA releases on tab hide / battery saver — the indicator follows the sentinel */
			sentinel.addEventListener('release', () => {
				if (wake.sentinel === sentinel) wake.sentinel = null;
				paintWake(false);
			});
		} catch { paintWake(false); }
	} else if (!want && wake.sentinel) {
		wake.sentinel.release();
	}
}
function setWake(want) {
	wake.want = want;
	paintWakeIntent();
	syncWakeLock();
}

/* ── the step player: the recorded file when it exists, the Speech API otherwise ── */
const stepAudio = document.createElement('audio');
stepAudio.preload = 'none';
document.body.append(stepAudio);
const player = { mode: null };
let utterance = null;
const playButtons = () => $$('ui-play:has(> button[command="--play-step"])');
const paintPlay = (on) => playButtons().forEach((p) => reflectPlay(p, on));

function speak(text, { onend } = {}) {
	if (!hasTTS) { onend?.(); return; }
	speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(text);
	u.lang = document.documentElement.lang || 'en-US';
	const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith(u.lang.slice(0, 2)));
	if (voice) u.voice = voice;
	u.onstart = () => { if (utterance === u) hush(true); };
	u.onend = u.onerror = () => {
		if (utterance !== u) return; /* cancel() fires the old utterance's error asynchronously */
		utterance = null;
		hush(false);
		onend?.();
	};
	utterance = u;
	speechSynthesis.speak(u);
}
/* while the page speaks — synthesised or recorded — the mic keeps listening, but only for
   interruptions (see INTERRUPT): the narration's own words must not drive the transport */
function hush(on) {
	voiceState.speaking = on;
}
function ttsStep() {
	player.mode = 'tts';
	paintPlay(true);
	speak(stepText(state.step), { onend: () => { if (player.mode === 'tts') stopStep(); } });
}
function audioStep(src) {
	player.mode = 'audio';
	stepAudio.src = src;
	stepAudio.play().catch(() => { if (player.mode === 'audio') ttsStepOrStop(); });
}
const ttsStepOrStop = () => hasTTS ? ttsStep() : stopStep();
function playStep() {
	if (player.mode === 'audio') { stepAudio.paused ? stepAudio.play().catch(() => {}) : stepAudio.pause(); return; }
	if (player.mode === 'tts') {
		if (speechSynthesis.paused) { speechSynthesis.resume(); paintPlay(true); }
		else { speechSynthesis.pause(); paintPlay(false); }
		return;
	}
	const src = steps[state.step].dataset.audio;
	if (src) audioStep(src); /* recorded first — a 404 lands on stepAudio's error → TTS */
	else ttsStepOrStop();
}
function stopStep() {
	if (player.mode === 'audio') { stepAudio.pause(); stepAudio.currentTime = 0; }
	if (player.mode === 'tts' && hasTTS) { utterance = null; speechSynthesis.cancel(); } /* the cancelled utterance's onend is ignored */
	if (player.mode) hush(false);
	player.mode = null;
	paintPlay(false);
}
/* mode-guarded: a failed load fires a late `pause` AFTER `error` has already handed over to TTS */
stepAudio.addEventListener('play', () => { if (player.mode === 'audio') { paintPlay(true); hush(true); setMediaSession(); } });
stepAudio.addEventListener('pause', () => { if (player.mode === 'audio' && !stepAudio.ended) { paintPlay(false); hush(false); } });
stepAudio.addEventListener('ended', () => { if (player.mode === 'audio') stopStep(); });
/* a missing/undecodable file surfaces on `error`, not on the play() promise */
stepAudio.addEventListener('error', () => { if (player.mode === 'audio') ttsStepOrStop(); });


/* ── Media Session: lock-screen / headset transport drives the same step player ── */
function setMediaSession() {
	if (!('mediaSession' in navigator)) return;
	const img = $('#hero');
	navigator.mediaSession.metadata = new MediaMetadata({
		title: `Step ${state.step + 1}: ${stepName(state.step + 1)}`,
		artist: $('#cook-title').textContent,
		album: 'browser.style recipes',
		artwork: img ? [{ src: img.currentSrc || img.src, sizes: '1200x900', type: 'image/png' }] : []
	});
	const handlers = {
		play: () => playStep(), pause: () => playStep(), stop: () => stopStep(),
		previoustrack: () => goto(state.step - 1, { announce: true }), nexttrack: () => goto(state.step + 1, { announce: true })
	};
	for (const [action, handler] of Object.entries(handlers)) {
		try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
	}
}

/* ── hands-free: SpeechRecognition layered on the same commands ─────────── */
const voiceState = { want: false, rec: null, speaking: false };
const heard = $('#voice-heard');
const hint = (text) => { const el = $('#voice-hint'); if (el) el.textContent = text; };
function paintMic(on) {
	for (const beacon of $$('#mic-state, #cook-mic')) { /* red + blink: the REC convention */
		beacon.setAttribute('theme', on ? 'red' : 'gray');
		on ? beacon.setAttribute('animation', 'blink') : beacon.removeAttribute('animation');
		beacon.textContent = on ? 'Listening' : 'Mic off';
	}
	for (const b of $$('button[command="--toggle-voice"]')) b.setAttribute('aria-pressed', String(voiceState.want));
}
const INTERRUPT = /\b(pause|stop|quiet|silence|next|back|previous|close|exit)\b/;
const COMMANDS_HEARD = [
	[/\b(next|forward|continue)\b/, () => goto(state.step + 1, { announce: true })],
	[/\b(back|previous)\b/, () => goto(state.step - 1, { announce: true })],
	[/\b(repeat|again|read)\b/, () => { stopStep(); playStep(); }],
	[/\b(pause|resume|play)\b/, () => playStep()],
	[/\bingredients?\b/, () => { stopStep(); speak(ingredientsText()); }],
	[/\b(start over|first step)\b/, () => goto(0, { announce: true })],
	[/\btimer\b/, () => { const b = timerButtons(state.step + 1)[0]; if (b) startTimer(b); }],
	[/\b(stop|quiet|silence)\b/, () => stopStep()],
	[/\b(close|exit|finish)\b/, () => cook.matches(':popover-open') && cook.hidePopover()]
];
function setupRecognition() {
	const rec = new SR();
	rec.lang = document.documentElement.lang || 'en-US';
	rec.continuous = true;
	rec.interimResults = false;
	rec.onstart = () => paintMic(true);
	rec.onresult = (e) => {
		const phrase = e.results[e.resultIndex][0].transcript.trim().toLowerCase();
		if (heard) heard.value = phrase;
		if (voiceState.speaking && !INTERRUPT.test(phrase)) return; /* speaking: interruptions only */
		COMMANDS_HEARD.find(([re]) => re.test(phrase))?.[1]();
	};
	/* recognition ends itself after a stretch of silence — keep it alive while wanted */
	rec.onend = () => { paintMic(false); if (voiceState.want) restartRecognition(); };
	rec.onerror = (e) => {
		if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
			stopListening();
			hint('Microphone access was denied — hands-free is off.');
		}
	};
	return rec;
}
function restartRecognition() { try { voiceState.rec?.start(); } catch { /* already started */ } }
async function startListening() {
	if (!SR) return;
	voiceState.want = true;
	voiceState.rec ??= setupRecognition();
	try { /* on-device recognition where the engine offers it (Chrome 139+) */
		if (SR.available && await SR.available({ langs: [voiceState.rec.lang], processLocally: true }) === 'available') voiceState.rec.processLocally = true;
	} catch { /* keep the default */ }
	paintMic(false);
	restartRecognition();
}
function stopListening() {
	voiceState.want = false;
	voiceState.rec?.abort();
	if (heard) heard.value = '';
	paintMic(false);
}

/* ── share / copy ───────────────────────────────────────────────────────── */
let statusTimer = null;
function status(text) {
	const out = $('.bar-status');
	if (!out) return;
	out.value = text;
	clearTimeout(statusTimer);
	statusTimer = setTimeout(() => { out.value = ''; }, 2500);
}
async function share() {
	const data = { title: $('#cook-title').textContent, text: $('[data-part="summary"]', article)?.textContent || '', url: location.href };
	try {
		if (navigator.share && (!navigator.canShare || navigator.canShare(data))) await navigator.share(data);
		else { await navigator.clipboard.writeText(location.href); status('Link copied'); }
	} catch { /* dismissed */ }
}
async function copyText() {
	const lines = [
		$('#cook-title').textContent,
		`Serves ${state.servings}`,
		'', 'Ingredients:',
		...$$('#ingredients data').map((el) => `- ${el.textContent.trim().replace(/\s+/g, ' ')}`),
		'', 'Method:',
		...steps.map((li, i) => `${i + 1}. ${$('h3', li).textContent}: ${$('p', li).textContent.trim().replace(/\s+/g, ' ')}`)
	];
	try { await navigator.clipboard.writeText(lines.join('\n')); status('Recipe copied'); }
	catch { status('Could not copy'); }
}

/* ── modality for the popover (a popover is not modal — Tab would walk out) ── */
const inerted = new WeakMap();
function setModal(frame, open) {
	if (open) {
		const stamped = [];
		for (let el = frame; el && el !== document.body && el.parentElement; el = el.parentElement) {
			for (const sib of el.parentElement.children) {
				if (sib === el || sib.inert) continue;
				sib.inert = true;
				stamped.push(sib);
			}
		}
		inerted.set(frame, stamped);
	} else {
		for (const el of inerted.get(frame) || []) el.inert = false;
		inerted.delete(frame);
	}
}

/* ── the command router — every button on the page speaks command= ──────── */
const COMMANDS = new Set(['--next-step', '--prev-step', '--play-step', '--timer',
	'--servings-up', '--servings-down', '--toggle-units', '--toggle-wake', '--toggle-voice', '--share', '--copy',
	'show-popover', 'toggle-popover']);
const route = createCommandRouter(COMMANDS, ({ command, source, target }) => {
	switch (command) {
		case '--next-step': goto(state.step + 1, { announce: voiceState.want }); break;
		case '--prev-step': goto(state.step - 1, { announce: voiceState.want }); break;
		case '--play-step': playStep(); break;
		case '--timer': if (source) startTimer(source); break;
		case '--servings-up': setServings(state.servings + 1); break;
		case '--servings-down': setServings(state.servings - 1); break;
		case '--toggle-units': state.units = state.units === 'imperial' ? 'metric' : 'imperial'; renderMeasures(); save(); break;
		case '--toggle-wake': setWake(!wake.want); break;
		case '--toggle-voice': voiceState.want ? stopListening() : startListening(); break;
		case '--share': share(); break;
		case '--copy': copyText(); break;
		case 'show-popover': case 'toggle-popover':
			/* the built-in command fires on the target BEFORE the default action: put the
			   transform origin on the invoking button, so the panel grows from it */
			if (target === cook && source) {
				const r = source.getBoundingClientRect();
				cook.style.setProperty('--ox', `${r.x + r.width / 2}px`);
				cook.style.setProperty('--oy', `${r.y + r.height / 2}px`);
			}
			break;
	}
});
route(document);

/* ── cook-mode lifecycle ────────────────────────────────────────────────── */
cook.addEventListener('toggle', (e) => {
	const open = e.newState === 'open';
	setModal(cook, open);
	if (open) {
		goto(state.step, { scroll: false });
		setWake(true); /* kitchen: hands are wet, the screen stays on until you leave */
		$('.cook-nav button[command="--next-step"]')?.focus();
	} else {
		stopStep();
		stopListening();
		setWake(false);
	}
});
cook.addEventListener('keydown', (e) => {
	const key = { ArrowRight: state.step + 1, ArrowLeft: state.step - 1, Home: 0, End: N - 1 }[e.key];
	if (key === undefined || e.target.matches('input, textarea')) return;
	e.preventDefault();
	goto(key);
});

/* ── boot ───────────────────────────────────────────────────────────────── */
load();
cook.setAttribute('data-ready', '');
applyChecked();
renderMeasures();
goto(state.step, { scroll: false });
document.addEventListener('visibilitychange', syncWakeLock);
addEventListener('pagehide', () => { if (hasTTS) speechSynthesis.cancel(); });
if (hasTTS) speechSynthesis.getVoices(); /* warms the async voice list */
const unsupported = (selector, title) => { for (const b of $$(selector)) { b.disabled = true; b.title = title; } };
if (!('wakeLock' in navigator)) unsupported('button[command="--toggle-wake"]', 'Screen Wake Lock is not supported here');
if (!SR) { unsupported('button[command="--toggle-voice"]', 'Speech recognition is not supported here'); hint('Hands-free voice control is not supported in this browser — the buttons and arrow keys do the same.'); }
