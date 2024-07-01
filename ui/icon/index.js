class UIIcon extends HTMLElement {
	static get observedAttributes() {
		return ['type', 'size', 'margin', 'stroke', 'open'];
	}

	constructor() {
		super();
		const shadow = this.attachShadow({ mode: 'open' });
		const stylesheet = new CSSStyleSheet();
		stylesheet.replaceSync(`
			:host *, :host *::after, :host *::before { box-sizing: border-box; }
			:host {
				--_bdrs: 50%;
				--_bdw: 2px;
				--_bdwh: calc(var(--_bdw) / 2);
				--_cosh: calc(1em * cos(45deg));
				--_fz: 300%;
				--_trs: .25s cubic-bezier(.4, 0, .2, 1);

	background: crimson;

				// aspect-ratio: 1 / 1;
				border-radius: var(--_bdrs);
				display: inline-grid;
				font-size: var(--_fz);
				height: 1em;
				// margin-block: var(--_mb, 0);
				// margin-inline: var(--_mi, var(--_mis, 0) var(--_mie, 0));
				// place-self: start center;
							
				transition: var(--_trs);
				width: 1em;
			}
					:host::before,
					:host::after {
						box-sizing: border-box;
						content: "";
						display: block;
						grid-area: 1 / 1;
						place-self: center;
						transition: var(--_trs);
					}

					/* Arrow, Check, Chevron (Common: Cross, Menu, Plus) */
					:host([type*=arrow])::after,
					:host([type=check])::after,
					:host([type*=chevron])::after {
							border-color: currentColor;
							border-style: solid;
							border-width: var(--_bdw) var(--_bdw) 0 0;
							height: var(--_cosh);
							rotate: 45deg;
							width: var(--_cosh);
					}
					:host([type*=arrow])::before,
					:host([type=cross])::before,
					:host([type*=menu])::before,
					:host([type*=plus])::before,
					:host([type=cross])::after,
					:host([type*=menu])::after,
					:host([type*=minus])::after,
					:host([type*=plus])::after {
							background-color: currentColor;
							height: var(--_bdw);
							width: 1em;
					}
					:host([type*=arrow])::after {
							translate: calc((.25em - var(--_bdw)) * cos(45deg));
					}
					:host([type*=arrow])::before {
							width: calc(1em - var(--_bdw));
							translate: calc(0px - var(--_bdwh)) calc((.5em * cos(45deg)) - var(--_bdwh));
					}
					:host([type=check])::after {
							border-width: 0 var(--_bdw) var(--_bdw) 0;
							height: calc(1em * cos(22.5deg));
							translate: 0 calc((.25em - var(--_bdwh)) * cos(45deg) * -1);
							width: calc(var(--_cosh)* 0.6);
					}
					:host([type*=chevron])::after {
							translate: calc((.25em - var(--_bdwh)) * cos(45deg) * -1) 0;
					}

					/* Grid, Kebab, Meatball, Menu */
					:host([type=drag])::after,
					:host([type=grid])::after,
					:host([type=kebab])::after,
					:host([type=meatball])::after {
							background: currentColor;
							border-radius: 50%;
							height: .2em;
							width: .2em;
					}
					:host([type=drag]) { translate: .2em 0; }
					:host([type=drag])::after {
							box-shadow: 
									-.4em -.4em 0, 0 -.4em 0,
									-.4em 0 0,
									-.4em .4em 0, 0 .4em 0;
					}
					:host([type=grid])::after {
							box-shadow: 
									-.3em -.3em 0, 0 -.3em 0, .3em -.3em 0,
									-.3em 0 0, .3em 0 0,
									-.3em .3em 0, 0 .3em 0, .3em .3em 0;
					}
					:host([type=kebab])::after { box-shadow: 0 .3em 0, 0 -.3em 0; }
					:host([type=meatball])::after { box-shadow: -.3em 0 0, .3em 0 0; }
					:host([type=burger-menu]) { gap: .66em; }
					:host([type=burger-menu])::before { box-shadow: 0 .33em 0 currentColor; }
					:host([type=veggie-menu]) { gap: .33em; }

					/* Angle */
					:host([type~=down]) { rotate: 90deg; }
					:host([type=cross]), :host([type~=downleft]) { rotate: 135deg; }
					:host([type~=downright]) { rotate: 45deg; }
					:host([type~=left]) { rotate: -180deg; }
					:host([type~=up]) { rotate: -90deg; }
					:host([type~=upleft]) { rotate: -135deg; }
					:host([type~=upright]) { rotate: -45deg; }
					:host([type*=cross])::after,
					:host([type*=plus])::after { rotate: -90deg; }

					/* Play, Pause, Stop, First, Last */
					:host([type*=pause]), :host([type*=play]), :host([type*=stop]), :host([type*=triangle]) {
							background: currentColor;
							border-radius: 0;
					}
					:host([type*=pause]) { clip-path: polygon(40% 0%,0% 0%,0% 100%,40% 100%,40% 0%,60% 0%,100% 0%,100% 100%,60% 100%,60% 0%); }
					:host([type*=play]) { clip-path: polygon(16% 0%,15% 100%,100% 50%); }
					:host([type*=stop]) { clip-path: inset(0 0 0 0 round 1px); }
					:host([type*=triangle]) { clip-path: polygon(15% 0%,85% 50%,15% 100%);}
					:host([type*=first]), :host([type*=last]) {
							translate: .22em 0;
					}
					:host([type*=first])::before, :host([type*=last])::before {
							background: currentColor;
							height: 1em;
							translate: .88em calc(0px - var(--_bdw));
							width: var(--_bdw);
					}
					:host([type*=last]) { translate: -.22em 0; }

					/* Margin */
					:host([margin=start]) { --_mis: 1ch; }
					:host([margin=start-auto]) { --_mis: auto; }
					:host([margin=end]) { --_mie: 1ch; }
					:host([margin=end-auto]) { --_mie: auto; }
					:host([margin=xs]) { --_mb: .25ch; --_mi: .25ch; }
					:host([margin=sm]) { --_mb: .5ch; --_mi: .5ch; }
					:host([margin=md]) { --_mb: 1ch; --_mi: 1ch; }
					:host([margin=lg]) { --_mb: 1.5ch; --_mi: 1.5ch; }
					:host([margin=xl]) { --_mb: 2ch; --_mi: 2ch; }

					/* Size */
					:host([size*=xs]) { --_fz: 50%; }
					:host([size*=sm]) { --_fz: 60%; }
					:host([size*=md]) { --_fz: 80%; }
					:host([size*=lg]) { --_fz: 120%; }
					:host([size*=xl]) { --_fz: 140%; }
					:host([size*=xxl]) { --_fz: 200%; }

					/* State */
					:host([open]) >* >:host([type=kebab]), :host([open]) >* >:host([type=meatball]), :host([open]) >* >:host([type=plus-cross]) { rotate: 45deg; }
					:host([open]) >* >:host([type=menu]) { gap: 0; }
					:host([open]) >* >:host([type=menu])::before { box-shadow: none; rotate: -45deg; }
					:host([open]) >* >:host([type=menu])::after { rotate: 45deg; }
					:host([open]) >* >:host([type=down]) { scale: -1; }
					:host([open]) >* >:host([type=grid]) { rotate: 135deg; }
					:host([open]) >* >:host([type=grid]), :host([open]) >* >:host([type=kebab]), :host([open]) >* >:host([type=meatball])::after { box-shadow: -.3em 0 0, 0 .3em 0, 0 -.3em 0, .3em 0 0; }
					:host([open]) >* >:host([type=plus-minus])::after { rotate: 0deg; }
					:host([open]) >* >:host([type=right]) { rotate: 90deg; }

					/* re-visit */
					:host([open]) >* * :host([type=right]) { rotate: 90deg; }

					/* [type="checkbox"] + :host */
					:checked + :host([type=down]) { scale: -1; }
					:checked + :host([type=kebab]), :checked + :host([type=meatball]), :checked + :host([type=plus-cross]) { rotate: 45deg; }
					:checked + :host([type=menu]) {
							gap: 0;
					}
					:checked + :host([type=menu])::before { box-shadow: none; rotate: -45deg; }
					:checked + :host([type=menu])::after { rotate: 45deg; }

					/* Stroke */
					:host([stroke*=xs]) { --_bdw: 1px; }
					:host([stroke*=md]) { --_bdw: 3px; }
					:host([stroke*=lg]) { --_bdw: 4px; }
					:host([stroke*=xl]) { --_bdw: 6px; }

					/*Dir: rtl*/
					[dir=rtl] :host {
							&[type~=arrow]::before {
									translate: calc(var(--_bdwh) + var(--_bdw)) calc((.5em * cos(45deg)) - var(--_bdwh));
							}
							&[type~=left] { translate: -.2em 0; }
							&[type~=right] { translate: .2em 0; }
							&[type~=down] { translate: 0 -.2em; }
							&[type~=downleft] { rotate: 45deg; translate: -.11em -.11em; }
							&[type~=downright] { rotate: 135deg; translate: .11em -.11em; }
							&[type~=up] { translate: 0 .2em; }
							&[type~=upleft] { rotate: -45deg; translate: -.11em .11em; }
							&[type~=upright] { rotate: -135deg; translate: .11em .11em; }
							&[type*=first] {
									translate: -.22em 0;
									&::before { translate: .33em calc(0px - var(--_bdw)); }
							}
							&[type*=last] {
									translate: .22em 0;
									&::before { translate: .33em calc(0px - var(--_bdw)); }
							}
							&[type~=left] { rotate: 0deg; }
							&[type~=right] { rotate: -180deg; }
					}
					[dir=rtl] :host([open]) >* * :host([type=right]) { rotate: -270deg; }
			`);

			shadow.adoptedStyleSheets = [stylesheet];
	}

	attributeChangedCallback(name, oldValue, newValue) {
			if (oldValue !== newValue) {
					// this.render();
			}
	}

	connectedCallback() {
			// this.render();
	}

	render() {
			// Additional rendering logic can be added here
	}
}

customElements.define('ui-icon', UIIcon);
