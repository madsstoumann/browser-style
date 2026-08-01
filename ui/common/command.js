/**
 * createCommandRouter — shared plumbing for Invoker Commands controllers.
 *
 * The native CommandEvent does NOT bubble, so every controller in this system
 * registers ONE delegated listener in the CAPTURE phase (which always runs
 * root→target, bubbling or not). Browsers without native custom commands get a
 * matching CustomEvent('command') fallback dispatched by the invoking component;
 * both shapes are read transparently (`event.command ?? event.detail?.command`).
 *
 * Consumers: ui/play/command.js (--toggle-play/--play/--pause),
 * ui/lightbox/command.js (--lightbox-layout). Pattern reference:
 * ui/video-embed/ui-video-embed.js implements the same shape standalone.
 *
 * @param {Set<string>} commands  commands this controller answers to
 * @param {(ctx: {command: string, source: Element|undefined, target: Element, event: Event}) => void} handler
 * @returns {(root?: Document|Element) => () => void}  init(root) → unbind()
 * @version 1.0.0
 */
export function createCommandRouter(commands, handler) {
	const onCommand = (event) => {
		const command = event.command ?? event.detail?.command;
		if (!command || !commands.has(command)) return;
		const target = event.target;
		if (!target) return;
		handler({ command, source: event.source ?? event.detail?.source, target, event });
	};
	return (root = document) => {
		root.addEventListener('command', onCommand, true);   // capture: CommandEvent doesn't bubble
		return () => root.removeEventListener('command', onCommand, true);
	};
}
