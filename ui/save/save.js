/**
 * <ui-save> toggle — the one listener the CSS has always been waiting for.
 *
 *   <script type="module" src="/ui/save/save.min.js"></script>
 *
 * ui-save paints from the button's `aria-pressed`; nothing in the component flips it,
 * because "what does saving mean" is the application's business, not the component's.
 * This module is the DEMO answer: flip the attribute, let CSS fill the glyph, and
 * announce it so a real app can persist. Docs: readme.md § Toggling (script)
 *
 * The primary path is the documented one — the invoker fires a `command` event on its
 * `commandfor` target. That event does NOT bubble, so it cannot be delegated at the
 * document; a listener goes on each distinct target instead. A click fallback covers
 * engines without Invoker Commands, and a `data-command-wired` flag on the target keeps
 * the two from double-toggling where both fire.
 *
 * aria-label is deliberately NOT swapped on toggle: aria-pressed IS the state of a
 * toggle button, and renaming a control while it keeps its identity is the thing
 * toggle-button guidance warns against.
 */
const SUPPORTS_COMMAND = typeof globalThis.CommandEvent === 'function';

/** Flip one invoker and tell the page. `detail.target` is the card/frame it names. */
const toggle = (button) => {
	const saved = button.getAttribute('aria-pressed') !== 'true';
	button.setAttribute('aria-pressed', String(saved));
	const id = button.getAttribute('commandfor');
	button.dispatchEvent(new CustomEvent('ui-save', {
		bubbles: true,
		composed: true,
		detail: { saved, target: id ? document.getElementById(id) : null }
	}));
};

const invokerOf = (node) => node?.closest?.('ui-save > button') || null;

/** Wire the `command` listener onto every target a save button points at. */
const wire = (root = document) => {
	if (!SUPPORTS_COMMAND) return;
	for (const button of root.querySelectorAll('ui-save > button[commandfor]')) {
		const target = document.getElementById(button.getAttribute('commandfor'));
		if (!target || target.dataset.commandWired) continue;
		target.dataset.commandWired = 'save';
		target.addEventListener('command', (event) => {
			if (event.command !== '--save') return;
			const invoker = invokerOf(event.source) || event.source;
			if (invoker) toggle(invoker);
		});
	}
};

/* Fallback for engines without Invoker Commands: the click never became a command, so
   no target was wired and nothing has toggled yet. Delegated, so it also covers buttons
   added after load and buttons with no commandfor at all. */
document.addEventListener('click', (event) => {
	const button = invokerOf(event.target);
	if (!button) return;
	const id = button.getAttribute('commandfor');
	const target = id ? document.getElementById(id) : null;
	if (target?.dataset.commandWired) return; /* the command listener owns this one */
	toggle(button);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => wire());
else wire();

export { toggle, wire };
export default wire;
