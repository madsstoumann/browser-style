import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class JobCard extends BaseCard {
	constructor() {
		super();
	}

	renderSalaryRange(salaryRange, useSchema, settings) {
		if (!salaryRange) return '';
		
		const { min, max, currency, period } = salaryRange;
		const currencySymbol = currency === 'USD' ? '$' : currency;
		
		return `
			<div ${getStyle('cc-job-salary', settings)} ${useSchema ? 'itemprop="baseSalary" itemscope itemtype="https://schema.org/MonetaryAmount"' : ''}>
				<span class="material-icons">attach_money</span>
				<span ${getStyle('cc-job-salary-range', settings)}>
					${useSchema ? `<meta itemprop="currency" content="${currency || 'USD'}">` : ''}
					<span ${useSchema ? `itemprop="value" itemscope itemtype="https://schema.org/QuantitativeValue"` : ''}>
						${useSchema ? `<meta itemprop="minValue" content="${min}">` : ''}
						${useSchema ? `<meta itemprop="maxValue" content="${max}">` : ''}
						${currencySymbol}${min?.toLocaleString()} - ${currencySymbol}${max?.toLocaleString()}
					</span>
					${period ? ` ${period}` : ''}
				</span>
			</div>
		`;
	}

	renderQualifications(qualifications, useSchema, settings) {
		if (!qualifications?.length) return '';
		
		return `
			<div ${getStyle('cc-job-qualifications', settings)}>
				<h4 ${getStyle('cc-job-qualifications-title', settings)}>Requirements</h4>
				<ul ${getStyle('cc-job-qualifications-list', settings)} ${useSchema ? 'itemprop="qualifications"' : ''}>
					${qualifications.map(qual => `<li>${qual}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	renderBenefits(benefits, settings) {
		if (!benefits?.length) return '';
		
		return `
			<div ${getStyle('cc-job-benefits', settings)}>
				<h4 ${getStyle('cc-job-benefits-title', settings)}>Benefits</h4>
				<ul ${getStyle('cc-job-benefits-list', settings)}>
					${benefits.map(benefit => `<li>${benefit}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	renderJobMeta(jobData, useSchema, settings) {
		const meta = [];
		
		if (jobData.company) {
			meta.push(`
				<div ${getStyle('cc-job-meta-item', settings)} ${useSchema ? 'itemprop="hiringOrganization" itemscope itemtype="https://schema.org/Organization"' : ''}>
					<span class="material-icons">business</span>
					<span ${useSchema ? 'itemprop="name"' : ''}>${jobData.company}</span>
				</div>
			`);
		}
		
		if (jobData.location) {
			meta.push(`
				<div ${getStyle('cc-job-meta-item', settings)} ${useSchema ? 'itemprop="jobLocation" itemscope itemtype="https://schema.org/Place"' : ''}>
					<span class="material-icons">location_on</span>
					<span ${useSchema ? 'itemprop="name"' : ''}>${jobData.location}</span>
				</div>
			`);
		}
		
		if (jobData.employmentType) {
			meta.push(`
				<div ${getStyle('cc-job-meta-item', settings)}>
					<span class="material-icons">work</span>
					<span ${useSchema ? 'itemprop="employmentType"' : ''}>${jobData.employmentType}</span>
				</div>
			`);
		}
		
		if (jobData.applicationDeadline) {
			const deadline = new Date(jobData.applicationDeadline);
			meta.push(`
				<div ${getStyle('cc-job-meta-item', settings)}>
					<span class="material-icons">event</span>
					<span ${useSchema ? 'itemprop="validThrough" content="' + jobData.applicationDeadline + '"' : ''}>Apply by ${deadline.toLocaleDateString()}</span>
				</div>
			`);
		}
		
		if (!meta.length) return '';
		
		return `
			<div ${getStyle('cc-job-meta', settings)}>
				${meta.join('')}
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('JobPosting');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { job: jobData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.category && useSchema ? `<meta itemprop="industry" content="${content.category}">` : ''}
				${useSchema ? `<meta itemprop="datePosted" content="${new Date().toISOString().split('T')[0]}">` : ''}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="title"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.subheadline ? `<div ${getStyle('cc-job-subtitle', settings)}>${content.subheadline}</div>` : ''}
				
				${this.renderJobMeta(jobData, useSchema, settings)}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderSalaryRange(jobData.salaryRange, useSchema, settings)}
				${this.renderQualifications(jobData.qualifications, useSchema, settings)}
				${this.renderBenefits(jobData.benefits, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('job-card', JobCard);