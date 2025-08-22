import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderAuthors, renderEngagement, renderHeader, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class PollCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-poll');
		this.pollResults = null;
		this.userVote = null;
		this.hasVoted = false;
	}

	async connectedCallback() {
		super.connectedCallback();
		this.addEventListener('submit', this.handleFormSubmit.bind(this));
	}

	async handleFormSubmit(event) {
		event.preventDefault();
		
		if (this.hasVoted) return;
		
		const formData = new FormData(event.target);
		const pollData = this.data.poll;
		
		// Get selected choices (single for radio, multiple for checkbox)
		if (pollData.allowMultiple) {
			this.userVote = formData.getAll(`poll-${this.data.id}`);
		} else {
			this.userVote = formData.get(`poll-${this.data.id}`);
		}
		
		if (this.userVote && (Array.isArray(this.userVote) ? this.userVote.length > 0 : true)) {
			await this.submitVote();
		}
	}

	async submitVote() {
		try {
			const pollData = this.data.poll;
			// Simulate API call to submit vote
			const response = await this.fetchPollResults(pollData.endpoint);
			
			if (response.success) {
				this.hasVoted = true;
				this.pollResults = response.poll.results;
				this.innerHTML = this.render();
			}
		} catch (error) {
			console.error('Failed to submit vote:', error);
		}
	}

	async fetchPollResults(endpoint) {
		const response = await fetch(endpoint);
		return await response.json();
	}

	renderPollOptions() {
		if (!this.data.content.text) return '';
		
		const pollData = this.data.poll || {};
		const inputType = pollData.allowMultiple ? 'checkbox' : 'radio';
		const inputName = `poll-${this.data.id}`;
		const useSchema = this.settings.useSchema;

		return this.data.content.text.map(option => `
			<label ${getStyle('cc-poll-label', this.settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/Answer" itemprop="suggestedAnswer"' : ''}>
				<input 
					type="${inputType}" 
					name="${inputName}" 
					value="${option.id}"
					required
					${getStyle('cc-poll-input', this.settings)}
				>
				<strong ${getStyle('cc-poll-option-title', this.settings)} ${useSchema ? 'itemprop="text"' : ''}>${option.headline}</strong>
				${option.text ? `<small ${getStyle('cc-poll-option-desc', this.settings)} ${useSchema ? 'itemprop="description"' : ''}>${option.text}</small>` : ''}
			</label>`).join('');
	}



	renderPollResults() {
		if (!this.pollResults) return '';

		const labels = this.data.poll?.labels || {};
		const votesText = labels.votes || 'votes';
		const totalVotes = this.data.poll.totalVotes || 0;

		return this.data.content.text.map(option => {
			const result = this.pollResults[option.id] || { votes: 0, percentage: 0 };
			const isUserChoice = this.userVote === option.id;
			
			return `
				<div ${getStyle('cc-poll-result', this.settings)} ${isUserChoice ? 'data-user-choice' : ''}>
					<div ${getStyle('cc-poll-result-header', this.settings)}>
						<div ${getStyle('cc-poll-result-title', this.settings)}>
							${option.headline} ${isUserChoice ? '✓' : ''}
						</div>
						<div ${getStyle('cc-poll-result-stats', this.settings)}>
							${result.percentage}% (${result.votes} ${votesText})
						</div>
					</div>
					
						<progress ${getStyle('cc-poll-result-bar-container', this.settings)}
							max="100"
							value="${result.percentage}">
						</progress>
					
				</div>
			`;
		}).join('');
	}

	render() {
		const renderContext = this._setSchema('Question');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const showResults = this.hasVoted || (this.data.poll?.showResults === 'always');

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.category && useSchema ? `<meta itemprop="about" content="${content.category}">` : ''}
				
				${renderHeader(content, settings)}
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${this.data.authors?.length ? renderAuthors(this.data.authors, useSchema, settings) : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="text"' : ''}>${content.summary}</p>` : ''}
				
				<div ${getStyle('cc-poll', settings)}>
					${showResults ? `
						<div ${getStyle('cc-poll-results', settings)}>
							<h3 ${getStyle('cc-poll-results-title', settings)}>${this.data.poll?.labels?.results || 'Results'}</h3>
							${this.renderPollResults()}
							<div ${getStyle('cc-poll-total-votes', settings)}>
								${this.data.poll?.labels?.totalVotes || 'Total votes:'} ${this.data.poll?.totalVotes || 0}
							</div>
						</div>
					` : `
						<form ${getStyle('cc-poll-form', settings)}>
							<fieldset ${getStyle('cc-poll-voting', settings)}>
								${this.renderPollOptions()}
							</fieldset>
							${renderActions(this.data.actions, useSchema, settings)}
						</form>
					`}
				</div>
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
			</div>
		`;
	}
}

customElements.define('poll-card', PollCard);