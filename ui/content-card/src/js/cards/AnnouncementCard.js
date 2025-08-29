import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class AnnouncementCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-announcement');
	}

	getPriorityClass(priority) {
		const priorityClasses = {
			'low': 'cc-announcement-low',
			'medium': 'cc-announcement-medium',
			'high': 'cc-announcement-high',
			'critical': 'cc-announcement-critical'
		};
		return priorityClasses[priority] || 'cc-announcement-medium';
	}

	getPriorityIcon(priority) {
		const priorityIcons = {
			'low': 'info',
			'medium': 'campaign',
			'high': 'warning',
			'critical': 'error'
		};
		return priorityIcons[priority] || 'campaign';
	}

	renderAnnouncementMeta(announcementData, useSchema, settings) {
		const meta = [];
		
		if (announcementData.priority) {
			const icon = this.getPriorityIcon(announcementData.priority);
			meta.push(`
				<div ${getStyle('cc-announcement-meta-item', settings)}>
					<span class="material-icons">${icon}</span>
					<span ${getStyle('cc-announcement-priority', settings)}>
						${announcementData.priority.toUpperCase()} Priority
					</span>
				</div>
			`);
		}
		
		if (announcementData.announcementType) {
			meta.push(`
				<div ${getStyle('cc-announcement-meta-item', settings)}>
					<span class="material-icons">category</span>
					<span>${announcementData.announcementType}</span>
				</div>
			`);
		}
		
		if (announcementData.targetAudience) {
			meta.push(`
				<div ${getStyle('cc-announcement-meta-item', settings)}>
					<span class="material-icons">group</span>
					<span ${useSchema ? 'itemprop="audience" itemscope itemtype="https://schema.org/Audience"' : ''}>
						<span ${useSchema ? 'itemprop="audienceType"' : ''}>${announcementData.targetAudience}</span>
					</span>
				</div>
			`);
		}
		
		if (!meta.length) return '';
		
		return `
			<div ${getStyle('cc-announcement-meta', settings)}>
				${meta.join('')}
			</div>
		`;
	}

	renderEffectiveDates(effectiveDate, useSchema, settings) {
		if (!effectiveDate) return '';
		
		const { start, end } = effectiveDate;
		const startDate = new Date(start);
		const endDate = new Date(end);
		
		return `
			<div ${getStyle('cc-announcement-dates', settings)}>
				<span class="material-icons">schedule</span>
				<div ${getStyle('cc-announcement-dates-text', settings)}>
					${useSchema ? `<meta itemprop="datePublished" content="${start}">` : ''}
					${useSchema ? `<meta itemprop="expires" content="${end}">` : ''}
					<div ${getStyle('cc-announcement-date-range', settings)}>
						<strong>Effective:</strong> ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
						${end ? ` - ${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
					</div>
				</div>
			</div>
		`;
	}

	renderActionRequired(actionRequired, settings) {
		if (!actionRequired) return '';
		
		return `
			<div ${getStyle('cc-announcement-action', settings)}>
				<span class="material-icons">task_alt</span>
				<div ${getStyle('cc-announcement-action-text', settings)}>
					<strong>Action Required:</strong> ${actionRequired}
				</div>
			</div>
		`;
	}

	renderDismissButton(isDismissible, settings) {
		if (!isDismissible) return '';
		
		return `
			<button 
				type="button" 
				${getStyle('cc-announcement-dismiss', settings)}
				onclick="this.closest('announcement-card').remove()"
				aria-label="Dismiss announcement"
			>
				<span class="material-icons">close</span>
			</button>
		`;
	}

	render() {
		const renderContext = this._setSchema('SpecialAnnouncement');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { announcement: announcementData = {} } = this.data;
		const priorityClass = this.getPriorityClass(announcementData.priority);

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)} ${getStyle(priorityClass, settings)}>
				${useSchema ? `<meta itemprop="datePosted" content="${new Date().toISOString().split('T')[0]}">` : ''}
				${useSchema ? `<meta itemprop="spatialCoverage" content="Global">` : ''}
				${content.published?.datetime && useSchema ? `<meta itemprop="datePublished" content="${content.published.datetime}">` : ''}
				
				<div ${getStyle('cc-announcement-header', settings)}>
					${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
					${this.renderDismissButton(announcementData.isDismissible, settings)}
				</div>
				
				${this.renderAnnouncementMeta(announcementData, useSchema, settings)}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="text"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderEffectiveDates(announcementData.effectiveDate, useSchema, settings)}
				${this.renderActionRequired(announcementData.actionRequired, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('announcement-card', AnnouncementCard);