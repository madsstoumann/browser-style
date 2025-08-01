import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderAuthors, renderEngagement, renderHeader, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class PollCard extends BaseCard {
	constructor() {
		super();
		this.pollResults = null;
		this.userVote = null;
		this.hasVoted = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener('click', this.handlePollInteraction.bind(this));
	}

	async handlePollInteraction(event) {
		// Handle poll option selection
		if (event.target.matches('.cc-poll-option input[type="radio"]')) {
			this.userVote = event.target.value;
			this.updateVoteButton();
		}
		
		// Handle vote submission - check for vote button by text and type
		if (event.target.matches('.cc-action')) {
			const labels = this.data.poll?.labels || {};
			const voteText = labels.vote || 'Vote';
			const submitVoteText = labels.submitVote || 'Submit Vote';
			const buttonText = event.target.textContent.trim();
			
			if ((buttonText === voteText || buttonText === submitVoteText) && !this.hasVoted) {
				event.preventDefault();
				if (this.userVote) {
					await this.submitVote();
				}
			}
		}
	}

	updateVoteButton() {
		const labels = this.data.poll?.labels || {};
		const voteText = labels.vote || 'Vote';
		const submitVoteText = labels.submitVote || 'Submit Vote';
		
		const voteBtn = this.querySelector('.cc-action');
		const buttonText = voteBtn?.textContent.trim();
		if (voteBtn && (buttonText === voteText || buttonText === submitVoteText)) {
			voteBtn.disabled = !this.userVote;
			voteBtn.textContent = this.userVote ? submitVoteText : voteText;
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
		// Mock endpoint - replace with actual API call
		const mockEndpoint = endpoint.replace('/api/polls/', './api/polls/') + '.json';
		const response = await fetch(mockEndpoint);
		return await response.json();
	}

	renderPollOptions() {
		if (!this.data.content.text) return '';
		
		const pollData = this.data.poll || {};
		const inputType = pollData.allowMultiple ? 'checkbox' : 'radio';
		const inputName = `poll-${this.data.id}`;
		const useSchema = this.settings.useSchema;

		return this.data.content.text.map(option => `
			<div ${getStyle('cc-poll-option', this.settings)}>
				<label ${getStyle('cc-poll-label', this.settings)} ${useSchema ? 'itemscope itemtype="https://schema.org/Answer" itemprop="suggestedAnswer"' : ''}>
					<input 
						type="${inputType}" 
						name="${inputName}" 
						value="${option.id}"
						${getStyle('cc-poll-input', this.settings)}
					>
					<div ${getStyle('cc-poll-option-content', this.settings)}>
						<div ${getStyle('cc-poll-option-title', this.settings)} ${useSchema ? 'itemprop="text"' : ''}>${option.headline}</div>
						${option.text ? `<div ${getStyle('cc-poll-option-desc', this.settings)} ${useSchema ? 'itemprop="description"' : ''}>${option.text}</div>` : ''}
					</div>
				</label>
			</div>
		`).join('');
	}

	renderVoteAction(settings, useSchema) {
		if (!this.data.actions?.length) return '';
		
		const labels = this.data.poll?.labels || {};
		const voteText = labels.vote || 'Vote';
		const fallbackTitle = labels.fallbackTitle || 'Poll';
		
		const voteAction = this.data.actions.find(action => 
			action.text === voteText || action.type === 'submit'
		);
		
		if (!voteAction) return '';
		
		const voteActionSchema = useSchema ? 
			`itemscope itemtype="https://schema.org/VoteAction"` : '';
		
		const voteActionMeta = useSchema ? `
			<meta itemprop="target" content="#${this.data.id}">
			<meta itemprop="object" content="${this.data.content.headline || fallbackTitle}">
		` : '';
		
		return `
			<nav ${getStyle('cc-actions', settings)}>
				<button type="button" ${getStyle('cc-action', settings)} ${voteActionSchema}>
					${voteActionMeta}
					${voteAction.text || voteText}
				</button>
			</nav>
		`;
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
					<div ${getStyle('cc-poll-result-bar-container', this.settings)}>
						<progress 
							${getStyle('cc-poll-result-bar', this.settings)} 
							max="100"
							value="${result.percentage}">
						</progress>
					</div>
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
						<fieldset ${getStyle('cc-poll-voting', settings)}>
							${this.renderPollOptions()}
						</fieldset>
					`}
				</div>
				
				${showResults ? '' : this.renderVoteAction(settings, useSchema)}
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
			</div>
		`;
	}
}

customElements.define('poll-card', PollCard);