/**
 * ui-play command controller
 *
 * ONE delegated `command` listener that lets a <ui-play> (or any native invoker
 * <button command commandfor>) drive two kinds of target it can't drive itself:
 *
 *   - <video> / <audio>  → .play() / .pause(), and reflects the element's REAL
 *                          playback state back to the invoking <ui-play>.
 *   - any other element  → toggles CSS `animation-play-state` (running/paused).
 *
 * Custom commands handled: `--toggle-play`, `--play`, `--pause`. Built-in commands
 * (show-modal, toggle-popover, …) are ignored. The native CommandEvent does NOT
 * bubble, so the single page-level listener is registered in the CAPTURE phase (which
 * always runs root→target, bubbling or not). On browsers without native custom
 * commands, <ui-play> dispatches a matching CustomEvent('command') fallback that
 * carries the same shape in `detail` — read here transparently.
 *
 * Import for the side effect (auto-inits once), or call initPlayCommands() yourself.
 * @version 1.0.0
 */

const COMMANDS = new Set(['--toggle-play', '--play', '--pause']);

// Reflect the real state onto the invoking <ui-play>, if there is one.
function reflect(source, playing) {
	const uiPlay = source?.closest?.('ui-play');
	if (uiPlay) uiPlay.playing = playing;
}

function handleMedia(media, command, source) {
	const want = command === '--play' ? true
		: command === '--pause' ? false
		: media.paused;                 // --toggle-play
	if (want) {
		const p = media.play();
		if (p && typeof p.catch === 'function') p.catch(() => {});
	} else {
		media.pause();
	}
	// Bind once so the invoker follows the element's REAL state (native controls too).
	const uiPlay = source?.closest?.('ui-play');
	if (uiPlay && !media.__uiPlayBound) {
		media.__uiPlayBound = true;
		const on = () => { uiPlay.playing = !media.paused; };
		media.addEventListener('play', on);
		media.addEventListener('pause', on);
		media.addEventListener('ended', on);
	}
}

function handleAnimation(el, command, source) {
	// Only elements that actually carry a CSS animation — otherwise ignore, so this
	// controller never fights another (e.g. a <ui-media> YouTube embed) for the command.
	if (getComputedStyle(el).animationName === 'none') return;
	const paused = (el.style.animationPlayState || getComputedStyle(el).animationPlayState) === 'paused';
	const want = command === '--play' ? true
		: command === '--pause' ? false
		: paused;                       // --toggle-play: if paused, we want to play
	el.style.animationPlayState = want ? 'running' : 'paused';
	reflect(source, want);
}

function onCommand(event) {
	const command = event.command ?? event.detail?.command;
	if (!command || !COMMANDS.has(command)) return;
	const source = event.source ?? event.detail?.source;
	const target = event.target;
	if (!target) return;

	if (target instanceof HTMLMediaElement) handleMedia(target, command, source);
	else handleAnimation(target, command, source);
}

let inited = false;

export function initPlayCommands(root = document) {
	if (root === document) {
		if (inited) return;
		inited = true;
	}
	root.addEventListener('command', onCommand, true);   // capture: CommandEvent doesn't bubble
	return () => root.removeEventListener('command', onCommand, true);
}

// Auto-init for the common case (importing the module wires the page).
initPlayCommands();
