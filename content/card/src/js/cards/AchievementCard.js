import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class AchievementCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-achievement');
	}

	renderIssuingOrganization(organization, useSchema, settings) {
		if (!organization) return '';
		
		return `
			<div ${getStyle('cc-achievement-issuer', settings)} ${useSchema ? 'itemprop="recognizedBy" itemscope itemtype="https://schema.org/Organization"' : ''}>
				<span class="material-icons">business</span>
				<span ${useSchema ? 'itemprop="name"' : ''}>${organization}</span>
			</div>
		`;
	}

	renderDates(achievement, useSchema, settings) {
		const { dateEarned, expirationDate } = achievement;
		if (!dateEarned) return '';
		
		const earnedDate = new Date(dateEarned);
		const expDate = expirationDate ? new Date(expirationDate) : null;
		
		return `
			<div ${getStyle('cc-achievement-dates', settings)}>
				<div ${getStyle('cc-achievement-date-item', settings)}>
					<span class="material-icons">event</span>
					<div ${getStyle('cc-achievement-date-info', settings)}>
						<span ${getStyle('cc-achievement-date-label', settings)}>Earned</span>
						<time ${useSchema ? `itemprop="dateCreated" datetime="${dateEarned}"` : ''}>
							${earnedDate.toLocaleDateString()}
						</time>
					</div>
				</div>
				
				${expDate ? `
					<div ${getStyle('cc-achievement-date-item', settings)}>
						<span class="material-icons">schedule</span>
						<div ${getStyle('cc-achievement-date-info', settings)}>
							<span ${getStyle('cc-achievement-date-label', settings)}>Expires</span>
							<time ${useSchema ? `itemprop="expires" datetime="${expirationDate}"` : ''}>
								${expDate.toLocaleDateString()}
							</time>
						</div>
					</div>
				` : ''}
			</div>
		`;
	}

	renderCredentialInfo(achievement, useSchema, settings) {
		const items = [];
		
		if (achievement.credentialId) {
			items.push(`
				<div ${getStyle('cc-achievement-credential-item', settings)}>
					<span class="material-icons">badge</span>
					<div ${getStyle('cc-achievement-credential-info', settings)}>
						<span ${getStyle('cc-achievement-credential-label', settings)}>Credential ID</span>
						<span ${useSchema ? 'itemprop="identifier"' : ''}>${achievement.credentialId}</span>
					</div>
				</div>
			`);
		}
		
		if (achievement.skillLevel) {
			items.push(`
				<div ${getStyle('cc-achievement-credential-item', settings)}>
					<span class="material-icons">trending_up</span>
					<div ${getStyle('cc-achievement-credential-info', settings)}>
						<span ${getStyle('cc-achievement-credential-label', settings)}>Level</span>
						<span ${useSchema ? 'itemprop="educationalLevel"' : ''}>${achievement.skillLevel}</span>
					</div>
				</div>
			`);
		}
		
		if (!items.length) return '';
		
		return `
			<div ${getStyle('cc-achievement-credentials', settings)}>
				${items.join('')}
			</div>
		`;
	}

	renderVerification(verificationUrl, settings) {
		if (!verificationUrl) return '';
		
		return `
			<div ${getStyle('cc-achievement-verification', settings)}>
				<span class="material-icons">verified</span>
				<a href="${verificationUrl}" target="_blank" rel="noopener" ${getStyle('cc-achievement-verify-link', settings)}>
					Verify Credential
					<span class="material-icons">open_in_new</span>
				</a>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('EducationalOccupationalCredential');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { achievement: achievementData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${achievementData.achievementName && achievementData.achievementName !== content.headline ? `
					<div ${getStyle('cc-achievement-full-name', settings)} ${useSchema ? 'itemprop="name"' : ''}>${achievementData.achievementName}</div>
				` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderIssuingOrganization(achievementData.issuingOrganization, useSchema, settings)}
				${this.renderDates(achievementData, useSchema, settings)}
				${this.renderCredentialInfo(achievementData, useSchema, settings)}
				${this.renderVerification(achievementData.verificationUrl, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('achievement-card', AchievementCard);