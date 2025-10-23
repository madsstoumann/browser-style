/**
 * appCreate
 * @version 1.0.60
 * @summary 24-06-2021
 * @author Mads Stoumann
 * @description Builds the app-shell for OneBlock. This will/should be converted to a razor-view with partials in epiServer/Sitecore.
*/

import { uuid } from './uuid.mjs';
import appEditor from './app-editor.mjs';

export class appCreate {
	constructor(settings) {
		this.settings = Object.assign({

		}, settings);
		this.init();
	}

	async init() {
		try {
			this.model = await (await fetch(this.settings.model)).json();
			this.presets = await (await fetch(this.settings.presets)).json();
			this.props = await (await fetch(this.settings.props)).json()
		}
		catch(err) {
			// console.log(err)
		}

		let editor = '';
		let layers = '';
		let state = '';

		this.renderStyles(this.props);

		Promise.all(
			this.settings.config.map((url, index) => fetch(url)
				.then(r => r.json())
				.then(data => { 
					if (!data.id) data.id = uuid();
					editor+= `<div data-app-layer="${index}">${data.values.map(group => this.templateGroup(group)).join(' ')}</div>`;
					layers+= this.templateLayer(data, index);
					state+= this.templateState(data, index);
				})
				.catch(error => ({ error, url }))
			)
		).then(() => { 
			this.settings.app.innerHTML = this.templateApp(editor, layers, state);
			new appEditor(this.settings.app, this.settings.devices,  { presets: this.presets});
		});

		console.log(this)
	}

	
	/**
	 * @function renderStyles
	 * @param {Object} props
	 * @description Renders CSS Custom Properties Styles
	 */	
	renderStyles(props) {
		document.head.insertAdjacentHTML('beforeend', `<style>\n:root {\n${Object.entries(props).map(entry => entry[1].map(prop => `--${prop.key}:${prop.value};\n`).join(' ')).join(' ')}\n}</style>`);
	}

	/**
	 * @function templateApp
	 * @param {String} editor
	 * @param {String} layers
	 * @param {String} state
	 * @description Renders main application. TODO: Add config-files instead of hardcoded settings.
	 */	
	templateApp(editor, layers, state) {
		return `
		${state}
		<header class="app-header">
			<details class="app-menu">
				<summary class="app-label"><svg data-app="logo"><use xlink:href="${this.settings.icons}#icon-logo"></use></svg>
				</summary>
				<div class="app-menupanel">
					&copy; _valtech 2021
				</div>
			</details>

			<details class="app-menu">
				<summary class="app-label"><svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-settings"></use></svg>
				${this.settings.labels.settings}
				</summary>
				<div class="app-menupanel">
					<div class="app-editor-groupname">${this.settings.labels.background}</div>
					<div class="app-editor-code">
						<label title="default">
							<input type="radio" id="appgridc1" name="--main-bgc" value="initial" data-type="setting" data-root="app" checked>
							<span class="app-editor-color" style="background:hsl(200, 2%, 92%)"></span>
						</label>
						<label title="dark">
							<input type="radio" id="appgridc2" name="--main-bgc" value="hsl(200, 0%, 15%)" data-type="setting" data-root="app">
							<span class="app-editor-color" style="background:var(--bdc)"></span>
						</label>
						<label title="light">
							<input type="radio" id="appgridc3" name="--main-bgc" value="#FFF" data-type="setting" data-root="app">
							<span class="app-editor-color" style="background:#FFF"></span>
						</label>
						<label title="dusty green">
							<input type="radio" id="appgridc4" name="--main-bgc" value="hsl(162, 36%, 70%)" data-type="setting" data-root="app">
							<span class="app-editor-color" style="background:hsl(162, 36%, 70%)"></span>
						</label>
						<label title="dusty blue">
							<input type="radio" id="appgridc5" name="--main-bgc" value="hsl(200, 76%, 85%)" data-type="setting" data-root="app">
							<span class="app-editor-color" style="background:hsl(200, 76%, 85%)"></span>
						</label>
					</div>

					<label class="app-range" data-value="16px">${this.settings.labels.gridSize}
						<input type="range" name="--main-grid-size" min="2" max="32" step="1" value="16" data-root="app" data-property="grid" data-type="setting" data-suffix="px">
					</label>
					<label class="app-range" data-value="1">${this.settings.labels.opacity}
						<input type="range" name="--main-o" min="0.1" max="1" step="0.1" value="1" data-root="app" data-type="setting" data-suffix="">
					</label>
					<label class="app-editor-switch">
						<input type="checkbox" class="sr" name="--main-bgi" value="transparent" data-root="app" data-type="setting" data-value="initial" />
						<span></span>${this.settings.labels.hideGrid}
					</label>
					<label class="app-editor-switch">
						<input type="checkbox" class="sr" name="rtl" value="rtl" data-root="wysiwyg" data-type="rtl" data-value="ltr" />
						<span></span>${this.settings.labels.rightToLeft}
					</label>
				</div>
			</details>

			<label>
				<input type="checkbox" name="presettype" class="sr" data-type="presettype" />
				<span class="app-label">
					<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-container"></use></svg>
					${this.settings.labels.container}
				</span>
			</label>

			<a href="#editor-code" class="app-label" draggable="false">
				<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-raw"></use></svg>
				${this.settings.labels.code}
			</a>

			<label>
				<input class="app-text" type="text" value="${this.settings.labels.newPreset}" data-app="presetName" data-type="presetname" data-lpignore="true" />
			</label>

			<label  style="display:flex">
				<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-search"></use></svg>
				<input id="appFind" class="app-text" type="search" placeholder="${this.settings.labels.findPreset}" list="app-presets" data-type="search" data-app="search" data-lpignore="true" />
			</label>

			<label class="app-range app-zoom" data-value="1">${this.settings.labels.zoom}
				<input type="range" name="--zoom" min="0.1" max="5" value="1" step="0.1" data-root="app" data-type="setting" accesskey="z">
			</label>

			<label class="app-expand">
				<input type="checkbox" class="sr" name="--editor-w" value="1" data-root="app" data-suffix="px" data-type="setting" data-value="18rem" />
				<span class="app-label">
					<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-toggle"></use></svg>
					${this.settings.labels.hide}
				</span>
			</label>
		</header>

		<nav data-app="devicebar">
			<div class="app-bp-wrapper">
				<label>
					<input type="radio" name="devices" class="sr" data-type="device" value="0" form="devices" checked />
					<span class="app-bp app-bp-1" data-bp-rules="0">
						<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-device-mobile"></use></svg>
					</span>
				</label>
				<input type="number" class="app-bp-input" min="300" max="4000" value="400" data-type="breakpoint" data-breakpoint="0" name="breakpoints" form="devices" />
			</div>
			<div class="app-bp-wrapper">
				<label>
					<input type="radio" name="devices" class="sr" data-type="device" value="1" form="devices" />
					<span class="app-bp app-bp-2" data-bp-rules="0">
						<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-device-tablet"></use></svg>
					</span>
				</label>
				<input type="number" class="app-bp-input" min="300" max="4000" value="768" data-type="breakpoint" data-breakpoint="1" name="breakpoints" form="devices" />
			</div>
			<div class="app-bp-wrapper">
				<label>
					<input type="radio" name="devices" class="sr" data-type="device" value="2" form="devices" />
					<span class="app-bp app-bp-3" data-bp-rules="0">
						<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-device-laptop"></use></svg>
					</span>
				</label>
				<input type="number" class="app-bp-input" min="300" max="4000" value="1200" data-type="breakpoint" data-breakpoint="2" name="breakpoints" form="devices" />
			</div>
			<div class="app-bp-wrapper">
				<label>
					<input type="radio" name="devices" class="sr" data-type="device" value="3" form="devices" />
					<span class="app-bp app-bp-4" data-bp-rules="0">
						<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-device-desktop"></use></svg>
					</span>
				</label>
				<input type="number" class="app-bp-input" min="300" max="4000" value="1448" data-type="breakpoint" data-breakpoint="3" name="breakpoints" form="devices" />
			</div>	
		</nav>

		<main data-app="main">
			<div data-app="wysiwyg">
				<div data-app="template">
					${this.templateOneBlock(this.model)}
				</div>
				<code data-app="appwidth"></code>
				<svg class="app-resize"><use xlink:href="${this.settings.icons}#icon-resize"></use></svg>
			</div>

		</main>

		<footer data-app="footer"><!--{this.templatePresets(this.presets)}--></footer>
		<aside data-app="layers">${layers}</aside>
		<aside data-app="editor">${editor}</aside>

		<div data-editor id="editor-code">
			<div class="ob-editor-wrapper">
				<a href="#" class="ob-editor-close" draggable="false">
					<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-close"></use></svg>
				</a>
				<h2>${this.settings.labels.codePreset}</h2>
				<pre data-app="codepreset"></pre>
				<h2>${this.settings.labels.codeCSS}</h2>
				<pre data-app="codecss"></pre>
			</div>
		</div>
		<datalist id="app-presets" data-app="presets"></datalist>`;
	}

	/**
	* @function templateAnimation
	 * @param {Object} group
	*/	
	templateAnimation(group) {
		return `
		<label class="ob-editor-play" title="Play/Pause Animation">
			<input type="checkbox" data-prop="${group.prop}" data-type="animation" />
			<span class="app-editor-toggle">
				<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-play"></use></svg>
			</span>
		</label>`;
	}

	/**
	* @function templateColor
	 * @param {Object} group
	*/	
	templateColor(group) {
		const useProps = group.presets && this.props[group.presets]?.length > 0;
		const data = useProps ? this.props[group.presets] : group.values;
		return data.map((entry) => `
			<label title="${entry.name || entry.key || entry.value}">
				<input type="radio" id="${uuid()}" name="${group.prop}" value="${useProps && entry.key ? `var(--${entry.key})` : entry.value}" data-type="property" ${entry.checked ? 'checked':''} />
				<span class="app-editor-color" style="background:${useProps && entry.key ? `var(--${entry.key})` : entry.value}"></span>
			</label>`
		).join(' ')
	}

	/**
	* @function templateGroup
	 * @param {Object} group
	 * @param {String} icon
	 * @param {Boolean} isSub
	 * @description Creates an editor group, calls a sub-template-method depending on entry
	*/	
	templateGroup(group, icon = 'chv-down', isSub = false) {
		return `
		<details class="app-editor-group"${group.open ? ' open':''}>
			<summary class="app-editor-groupname${isSub ? ' app-editor-subgroup':''}"><span data-css-icon="${icon}">${group.name}&nbsp;${group.description ? this.templateHelp(group, 'description') : ''}<span class="app-editor-groupbreak"><em>•</em><em>•</em><em>•</em><em>•</em></span><i></i></span></summary>
			<div class="app-editor-grouppanel">
				${group.type === 'subgroup' && group.values.length ? group.values.map(subgroup => this.templateGroup(subgroup, 'plus', true)).join(' ') : `
				${group?.reset !== false ? this.templateReset(group) : ''}
				${group.help ? this.templateHelp(group) : ''}
				${group.animation ? this.templateAnimation(group) : ''}
				${group.raw ? this.templateRaw(group) : ''}
				<div class="app-editor-code">
					${group.type === 'color' ? this.templateColor(group) : ''}
					${group.type === 'icon' ? this.templateIcon(group) : ''}
					${group.type === 'radio' ? this.templateRadio(group) : ''}
					${group.type === 'range' ? this.templateRange(group) : ''}
					${group.type === 'select' ? this.templateSelect(group) : ''}
					${group.type === 'shape' ? this.templateShape(group) : ''}
					${group.type === 'toggle' ? this.templateToggle(group) : ''}
				</div>`}
			</div>
		</details>`
	}

	/**
	* @function templateHelp
	 * @param {Object} group
	 * @param {String} field
	*/	
	templateHelp(group, field = 'help') {
		return `
		<span class="app-editor-toggle app-editor-help" aria-description="${group[field]}" tabindex="0">
			<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-help"></use></svg>
		</span>`
	}

	/**
	* @function templateIcon
	 * @param {Object} group
	*/
	templateIcon(group) {
		const useProps = group.presets && this.props[group.presets]?.length > 0;
		const data = useProps ? this.props[group.presets] : group.values;
		return data.map((entry) => `
			<label title="${entry.name || entry.key || entry.value}">
				<input type="radio" id="${uuid()}" name="${group.prop}" value="${useProps ? `var(--${entry.key})` : entry.value}" data-type="property" />
				<span class="app-editor-shape" style="-webkit-mask-image:${useProps ? `var(--${entry.key})` : entry.value}"></span>
			</label>`
		).join(' ')
	}

	/**
	* @function templateLayer
	 * @param {Object} group
	 * @param {Number} index
	*/
	templateLayer(group, index) {
		return `
		<label for="${group.id}" class="app-label" data-app-layer="${index}">
			<svg class="app-icon"><use xlink:href="${this.settings.icons}#${group.icon}"></use></svg>
			${group.name}
		</label>`
	}

	/**
	* @function templateoneBlock
	 * @param {Object} data
	*/
	templateOneBlock(data) {
		let y = 0; /* Splash-line y-position */
		let unit = 100 / (data.splash.length + 1) /* Calculate line y-position basedd on number of lines */
		return `
		<div class="ob">
			<div class="ob__bg-wrapper">

			${data?.video?.type === 1 ? 
				`<video class="ob__bg-video" src="${data.video.src}"${data.bgImage ? ` poster="${data?.bgImage}"`:''}${data.video.autoPlay ? ` autoplay playsinline`:''}${data.video.controls ? ` controls`:''}${data.video.loop ? ` loop` : ''}${data.video.muted ? ` muted`:''}></video>` : ''
			}
			${data?.video?.type === 2 ? 
				`<iframe class="ob__bg-video" src="${data.video.src}${data.video.autoPlay ? '?autoplay=1' : ''}" frameborder="0" tabindex="-1" allow="autoplay; encrypted-media" allowfullscreen="allowfullscreen"></iframe>` : ''
			}
			
			${data.bgImage ? `
				<img alt="${data.caption||data.headline}" class="ob__bg" src="${data.bgImage}" data-app="media" data-app-group="ob-media">
			`: ''}

			${data.video?.overlay ? `
				<div class="ob__bg-overlay">
					<button type="button" class="ob__bg-overlay-cta" aria-label="Play/Pause">
						<span class="ob__bg-overlay-icon"></span>
					</button>
				</div>
			`: ''}

			${data.caption ? `
				<div class="ob__bg-caption" data-app-group="ob-caption">
					${data.caption}
				</div>
			`: ''}

				${data.image ? `
				<span class="ob__img-wrapper" data-app-group="appImage">
					<img alt="" class="ob__img" src="${data.image}" data-app="image" data-app-group="appImage">
				</span>`: ''}

				${data.splash.length > 0 ? `
				<div class="ob__splash-wrapper">
					<div class="ob__splash" data-app-group="ob-splash">
						<svg viewBox="0 0 100 100">
							<g class="ob__splash-lines">
							${data.splash.map((entry, index) => `<text x="50%" y="${y+=unit}%" class="ob__splash-line-${index+1}">${entry}</text>`).join('')}	
							</g>
						</svg>
					</div>
				</div>`: ''}

			</div>

			<section class="ob__content" data-app-group="ob-content">
				${data.tagline ? `<div class="ob__tagline" data-app-group="ob-tagline">${data.tagline}</div>` : ''}
				${data.headline ? `<${data.headerTag} class="ob__headline" data-app-group="ob-heading">${data.headline}</${data.headerTag}>` : ''}
				${data.shortText || data.description ? `
				<div class="ob__text" data-app-group="ob-text">
					${data.shortText ? `<p class="ob__text--intro">${data.shortText}</p>` : ''}
					${data.description ? `<p class="ob__text--full" data-app-group="ob-text">${data.description}</p>` : ''}
				</div>` : ''}
				

				${data.offerPrice ? `
				<div class="ob__offer">
					${data.offerBase ? `<span class="ob__offer-base" data-app-group="ob-offer">${data.offerBase}</span>`: ''}
					<span class="ob__offer-price" data-app-group="ob-offer">${data.offerPrice}</span>
					${data.offerCurrency ? `<span class="ob__offer-currency" data-app-group="ob-offer">${data.offerCurrency}</span>` : ''}
					${data.offerText ? `<div class="ob__offer-text" data-app-group="ob-offer">${data.offerText}</div>` : ''}
				</div>` : ''}

				${data.meta.length > 0 ? `
				<nav class="ob__meta">
					${data.meta.map(entry => `
					<span class="ob__meta-item" data-app-group="ob-share" aria-label="${entry.text}">
						<svg class="ob__meta-icon"><use xlink:href="${entry.icon}"></use></svg>
						<!--<span class="ob__meta-text" data-app-group="ob-share">${entry.text}</span>-->
					</span>`).join('')
					}
				</nav>` : ''}

				<nav class="ob__link-wrapper">
					<span class="ob__link-text" data-app-group="ob-cta"><i></i>${data.linkText}</span>
					<span class="ob__link-text-sec" data-app-group="ob-link2"><i></i>${data.linkTextSecondary}</span>
				</nav>

			</section>
		</div>`
	}

	/**
	* @function templatePresets
	 * @param {Array} presets
	*/
	templatePresets(presets) {
		return presets.map(preset => `
		<label class="app-quick-preset">
			<input type="checkbox" data-preset='${JSON.stringify(preset)}' data-type="preset">
			<svg class="app-icon"><use xlink:href="${this.settings.icons}#${preset.icon}"></use></svg>
			<!--<span>${preset.name}</span>-->
		</label>`).join(' ');
	}

	/**
	* @function templateRadio
	 * @param {Object} group
	*/
	templateRadio(group) {
		const useProps = group.presets && this.props[group.presets]?.length > 0;
		const data = useProps ? this.props[group.presets] : group.values;
		return data.map((entry) => `
			<label class="app-editor-icon" title="${entry.name || entry.key || entry.value}">
				<input type="radio" id="${uuid()}" name="${group.prop}" value="${entry.value}" data-type="property" ${entry.checked ? 'checked':''} />
				<span><svg class="app-icon"><use xlink:href="${this.settings.icons}#${entry.icon}"></use></svg></span>
			</label>`
		).join(' ')
	}

	/**
	* @function templateRange
	 * @param {Object} group
	*/
	templateRange(group) {
		return `
			<label class="app-editor-range" data-value="${group.value}${group.suffix}">
				<input type="range" name="${group.prop}" min="${group.min}" max="${group.max}" step="${group.step}" value="${group.value}" data-type="property" data-suffix="${group.suffix}" />
			</label>`
	}

	/**
	* @function templateRaw
	 * @param {Object} group
	*/
	templateRaw(group) {
		const id = uuid();
		return `
		<input type="checkbox" id="${id}" data-type="raw" />
		<label class="app-editor-toggle" for="${id}" title="Toggle code">
			<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-code"></use></svg>
		</label>
		<textarea class="app-editor-raw" name="${group.prop}" data-type="property"></textarea>`
	}

	/**
	* @function templateReset
	 * @param {Object} group
	*/
	templateReset(group) {
		return `
		<label class="ob-editor-reset" title="Reset to default value">
			<input type="checkbox" data-prop="${group.prop}" data-type="remval" value="remval" />
			<span class="app-editor-toggle">
				<svg class="app-icon"><use xlink:href="${this.settings.icons}#icon-reset"></use></svg>
			</span>
		</label>`;
	}

	/**
	* @function templateSelect
	 * @param {Object} group
	*/
	templateSelect(group) {
		const useProps = group.presets && this.props[group.presets]?.length > 0;
		const data = useProps ? this.props[group.presets] : group.values;
		return `
		<label class="app-editor-select">
			<select name="${group.prop}" data-type="property">
			<option disabled ${data.findIndex(entry => entry.selected) > -1? '': `selected`}>— not selected —</option>
			${data.map(entry => `
				<option value="${useProps && entry.key ? `var(--${entry.key})` : entry.value}"${entry?.selected ? ' selected':''}>
					${entry.name || entry.key || entry.value}
				</option>`).join(' ')}
			</select>
		</label>`;
	}

	/**
	* @function templateShape
	 * @param {Object} group
	*/
	templateShape(group) {
		const useProps = group.presets && this.props[group.presets]?.length > 0;
		const data = useProps ? this.props[group.presets] : group.values;
		return data.map((entry) => `
			<label title="${entry.name || entry.key || entry.value}">
				<input type="radio" id="${uuid()}" name="${group.prop}" value="${useProps ? `var(--${entry.key})` : entry.value}" data-type="property" />
				<span class="app-editor-shape" style="clip-path:${useProps ? `var(--${entry.key})` : entry.value}"></span>
			</label>`
		).join(' ')
	}

	/**
	* @function templateState
	 * @param {Object} group
	 * @param {Number} index
	*/
	templateState(group, index) {
		return `<input type="radio" name="layer" class="sr" data-type="layer" data-app-layer="${index}" data-app="${group.id}" id="${group.id}" value="${index}" ${index === 0 ? 'checked':''} />`
	}

	/**
	* @function templateToggle
	 * @param {Object} group
	*/
	templateToggle(group) {
		return `
		<label class="app-editor-switch">
			<input type="checkbox" class="sr" name="${group.prop}" value="transparent" data-type="toggle" />
			<span></span>${group.name}
		</label>
		`
	}
}