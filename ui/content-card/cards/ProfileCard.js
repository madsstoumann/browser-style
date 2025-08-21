import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class ProfileCard extends BaseCard {
	constructor() {
		super();
	}

	renderContacts(contacts, useSchema, settings) {
		if (!contacts?.length) return '';
		
		return contacts.map(contact => {
			const url = contact.type === 'email' ? `mailto:${contact.value}` : contact.value;
			const icon = {
				'email': 'email',
				'phone': 'phone',
				'linkedin': 'account_box',
				'twitter': 'alternate_email',
				'github': 'code'
			}[contact.type] || 'link';
			
			return `
				<a href="${url}" ${getStyle('cc-profile-contact', settings)} ${useSchema ? 'itemprop="contactPoint"' : ''}>
					<span class="material-icons">${icon}</span>
					<span>${contact.label}</span>
				</a>
			`;
		}).join('');
	}

	renderSkills(skills, settings) {
		if (!skills?.length) return '';
		
		return `
			<div ${getStyle('cc-profile-skills', settings)}>
				<h4 ${getStyle('cc-profile-skills-title', settings)}>Skills</h4>
				<div ${getStyle('cc-profile-skills-list', settings)}>
					${skills.map(skill => `<span ${getStyle('cc-profile-skill', settings)}>${skill}</span>`).join('')}
				</div>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Person');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { profile: profileData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.subheadline || profileData.jobTitle ? `
					<div ${getStyle('cc-profile-position', settings)} ${useSchema ? 'itemprop="jobTitle"' : ''}>
						${content.subheadline || profileData.jobTitle}
					</div>
				` : ''}
				
				${profileData.organization ? `
					<div ${getStyle('cc-profile-organization', settings)} ${useSchema ? 'itemprop="worksFor" itemscope itemtype="https://schema.org/Organization"' : ''}>
						<span ${useSchema ? 'itemprop="name"' : ''}>${profileData.organization}</span>
					</div>
				` : ''}
				
				${profileData.location ? `
					<div ${getStyle('cc-profile-location', settings)} ${useSchema ? 'itemprop="address"' : ''}>
						<span class="material-icons">location_on</span>
						${profileData.location}
					</div>
				` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${profileData.bio ? `
					<div ${getStyle('cc-profile-bio', settings)}>
						<h4 ${getStyle('cc-profile-bio-title', settings)}>About</h4>
						<p ${useSchema ? 'itemprop="description"' : ''}>${profileData.bio}</p>
					</div>
				` : ''}
				
				${this.renderSkills(profileData.skills, settings)}
				
				${profileData.contacts?.length ? `
					<div ${getStyle('cc-profile-contacts', settings)}>
						<h4 ${getStyle('cc-profile-contacts-title', settings)}>Connect</h4>
						<div ${getStyle('cc-profile-contacts-list', settings)}>
							${this.renderContacts(profileData.contacts, useSchema, settings)}
						</div>
					</div>
				` : ''}
				
				${useSchema && profileData.contacts ? `
					${profileData.contacts.map(contact => {
						if (contact.type === 'linkedin' || contact.type === 'twitter') {
							return `<link itemprop="sameAs" href="${contact.value}">`;
						}
						return '';
					}).join('')}
				` : ''}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('profile-card', ProfileCard);