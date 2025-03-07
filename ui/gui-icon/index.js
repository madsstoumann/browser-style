/**
 * @module gui-icon / gui-icon-button
 * @description Centralized icon library for browser.style UI components
 * @version 1.0.0
 * @date 2025-03-07
 * @author Mads Stoumann
 * @license MIT
 */

export function renderIcon(paths, part) {
	return `<svg part="icon${part ? ` ${part}`:''}" viewBox="0 0 24 24">${paths.map(d => `<path d="${d}" />`).join('')}</svg>`;
}

export function renderIconButton(icon, title, part, iconPart) {
	return `
		<button part="icon-button ${part || ''}" ${title ? `title="${title}"` : ''} type="button">
			${renderIcon(icon, iconPart)}
		</button>
	`;
}

// Icons: https://tabler.io/icons
export const icoArrowsLeftRight = ['M21 17l-18 0', 'M6 10l-3 -3l3 -3', 'M3 7l18 0', 'M18 20l3 -3l-3 -3'];
export const icoBrightness = ['M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M12 3l0 18', 'M12 9l4.65 -4.65', 'M12 14.3l7.37 -7.37', 'M12 19.6l8.85 -8.85'];
export const icoClose = ['M18 6l-12 12', 'M6 6l12 12'];
export const icoDotsVertical = ['M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0', 'M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0'];
export const icoExternalLink = ['M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6', 'M11 13l9 -9', 'M15 4h5v5'];
export const icoInternalLink = ['M12 6h6a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6', 'M13 13l-9 -9', 'M9 4h-5v5'];
export const icoReset = ['M3.06 13a9 9 0 1 0 .49 -4.087','M3 4.001v5'];
export const icoSearch = ['M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0', 'M21 21l-6 -6'];
export const icoSidebarLeft = ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M9 4l0 16'];
export const icoSidebarRight = ['M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z', 'M15 4l0 16'];

export const iconMap = {
	icoArrowsLeftRight,
	icoBrightness,
	icoClose,
	icoDotsVertical,
	icoExternalLink,
	icoInternalLink,
	icoReset,
	icoSearch,
	icoSidebarLeft,
	icoSidebarRight
};
