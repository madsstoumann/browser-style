import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class ContactCard extends BaseCard {
	constructor() {
		super();
	}

	getContactIcon(type) {
		const contactIcons = {
			'email': 'email',
			'phone': 'phone',
			'chat': 'chat',
			'sms': 'sms',
			'fax': 'fax'
		};
		return contactIcons[type] || 'contact_support';
	}

	renderContactMethods(contactMethods, useSchema, settings) {
		if (!contactMethods?.length) return '';
		
		return `
			<div ${getStyle('cc-contact-methods', settings)}>
				<h4 ${getStyle('cc-contact-methods-title', settings)}>Get in Touch</h4>
				<div ${getStyle('cc-contact-methods-list', settings)}>
					${contactMethods.map(method => {
						const icon = this.getContactIcon(method.type);
						const url = method.type === 'email' ? `mailto:${method.value}` : 
									method.type === 'phone' ? `tel:${method.value}` : 
									method.value;
						const isAvailable = method.available !== false; // Default to true if not specified
						
						return `
							<div ${getStyle('cc-contact-method', settings)}>
								<div ${getStyle('cc-contact-method-info', settings)}>
									<div ${getStyle('cc-contact-method-label', settings)}>${method.label}</div>
									${method.type === 'chat' ? `
										<div ${getStyle('cc-contact-method-value', settings)}>
											${method.value}
											${isAvailable ? '<span class="cc-contact-available">● Available</span>' : '<span class="cc-contact-unavailable">● Offline</span>'}
										</div>
									` : `
										<a href="${url}" ${getStyle('cc-contact-method-link', settings)} ${useSchema && method.type === 'phone' ? 'itemprop="telephone"' : useSchema && method.type === 'email' ? 'itemprop="email"' : useSchema ? 'itemprop="url"' : ''}>
											${method.value}
										</a>
									`}
								</div>
							</div>
						`;
					}).join('')}
				</div>
			</div>
		`;
	}

	renderContactInfo(contactData, useSchema, settings) {
		const info = [];
		
		if (contactData.contactType) {
			info.push(`
				<div ${getStyle('cc-contact-info-item', settings)}>
					<span ${useSchema ? 'itemprop="contactType"' : ''}>${contactData.contactType}</span>
				</div>
			`);
		}
		
		if (contactData.availableHours) {
			info.push(`
				<div ${getStyle('cc-contact-info-item', settings)}>
					<span ${useSchema ? 'itemprop="hoursAvailable"' : ''}>${contactData.availableHours}</span>
				</div>
			`);
		}
		
		if (contactData.responseTime) {
			info.push(`
				<div ${getStyle('cc-contact-info-item', settings)}>
					<span>Response time: ${contactData.responseTime}</span>
				</div>
			`);
		}
		
		if (contactData.department) {
			info.push(`
				<div ${getStyle('cc-contact-info-item', settings)}>
					<span ${useSchema ? 'itemprop="name"' : ''}>${contactData.department}</span>
				</div>
			`);
		}
		
		if (!info.length) return '';
		
		return `
			<div ${getStyle('cc-contact-info', settings)}>
				${info.join('')}
			</div>
		`;
	}

	renderLanguages(languages, useSchema, settings) {
		if (!languages?.length) return '';
		
		return `
			<div ${getStyle('cc-contact-languages', settings)}>
				<h4 ${getStyle('cc-contact-languages-title', settings)}>Languages Supported</h4>
				<div ${getStyle('cc-contact-languages-list', settings)}>
					${languages.map(language => `
						<span ${getStyle('cc-contact-language', settings)} ${useSchema ? 'itemprop="availableLanguage"' : ''}>${language}</span>
					`).join('')}
				</div>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('ContactPoint');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { contact: contactData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderContactInfo(contactData, useSchema, settings)}
				${this.renderContactMethods(contactData.contactMethods, useSchema, settings)}
				${this.renderLanguages(contactData.languagesSupported, useSchema, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('contact-card', ContactCard);