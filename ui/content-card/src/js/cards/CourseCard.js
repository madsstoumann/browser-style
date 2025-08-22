import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderEngagement, renderLinks, renderMedia, renderTags } from '../base/utils.js';

export class CourseCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-course');
	}

	renderPrerequisites(prerequisites, settings) {
		if (!prerequisites?.length) return '';
		
		return `
			<div ${getStyle('cc-course-prerequisites', settings)}>
				<h4 ${getStyle('cc-course-prerequisites-title', settings)}>Prerequisites</h4>
				<ul ${getStyle('cc-course-prerequisites-list', settings)}>
					${prerequisites.map(prereq => `<li>${prereq}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	renderLearningOutcomes(outcomes, useSchema, settings) {
		if (!outcomes?.length) return '';
		
		return `
			<div ${getStyle('cc-course-outcomes', settings)}>
				<h4 ${getStyle('cc-course-outcomes-title', settings)}>What you'll learn</h4>
				<ul ${getStyle('cc-course-outcomes-list', settings)} ${useSchema ? 'itemprop="teaches"' : ''}>
					${outcomes.map(outcome => `<li>${outcome}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	renderInstructor(instructor, useSchema, settings) {
		if (!instructor) return '';
		
		return `
			<div ${getStyle('cc-course-instructor', settings)}>
				<h4 ${getStyle('cc-course-instructor-title', settings)}>Instructor</h4>
				<div ${getStyle('cc-course-instructor-info', settings)}>
					<div ${getStyle('cc-course-instructor-name', settings)}>${instructor.name}</div>
					${instructor.title ? `<div ${getStyle('cc-course-instructor-title-text', settings)}>${instructor.title}</div>` : ''}
					${instructor.experience ? `<div ${getStyle('cc-course-instructor-experience', settings)}>${instructor.experience}</div>` : ''}
				</div>
			</div>
		`;
	}

	renderCourseMeta(courseData, useSchema, settings) {
		const meta = [];
		
		if (courseData.duration) {
			meta.push(`
				<div ${getStyle('cc-course-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="timeRequired"' : ''}>${courseData.duration}</span>
				</div>
			`);
		}
		
		if (courseData.difficultyLevel) {
			meta.push(`
				<div ${getStyle('cc-course-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="educationalLevel"' : ''}>${courseData.difficultyLevel}</span>
				</div>
			`);
		}
		
		if (courseData.provider) {
			meta.push(`
				<div ${getStyle('cc-course-meta-item', settings)}>
					<span ${useSchema ? 'itemprop="provider" itemscope itemtype="https://schema.org/Organization"' : ''}>
						<span ${useSchema ? 'itemprop="name"' : ''}>${courseData.provider}</span>
					</span>
				</div>
			`);
		}
		
		if (!meta.length) return '';
		
		return `
			<div ${getStyle('cc-course-meta', settings)}>
				${meta.join('')}
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Course');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { course: courseData = {} } = this.data;
		const price = courseData.price || {};

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.category && useSchema ? `<meta itemprop="about" content="${content.category}">` : ''}
				${useSchema && courseData.courseWorkload ? `<div itemprop="hasCourseInstance" itemscope itemtype="https://schema.org/CourseInstance" style="display:none;"><meta itemprop="courseMode" content="Online"><meta itemprop="courseWorkload" content="${courseData.courseWorkload}"></div>` : ''}
				
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderCourseMeta(courseData, useSchema, settings)}
				
				${price.current ? `
					<div ${getStyle('cc-course-price', settings)} ${useSchema ? 'itemprop="offers" itemscope itemtype="https://schema.org/Offer"' : ''}>
						${useSchema ? `<meta itemprop="priceCurrency" content="${price.currency || 'USD'}">` : ''}
						${useSchema ? `<meta itemprop="category" content="${content.category || 'Course'}">` : ''}
						<span ${getStyle('cc-course-price-current', settings)} ${useSchema ? `itemprop="price" content="${price.current}"` : ''}>${price.currency || '$'}${price.current}</span>
						${price.original && price.original > price.current ? `<del ${getStyle('cc-course-price-original', settings)}>${price.currency || '$'}${price.original}</del>` : ''}
						${useSchema ? `<meta itemprop="availability" content="https://schema.org/InStock">` : ''}
					</div>
				` : ''}
				
				${this.renderLearningOutcomes(courseData.learningOutcomes, useSchema, settings)}
				${this.renderPrerequisites(courseData.prerequisites, settings)}
				${this.renderInstructor(courseData.instructor, useSchema, settings)}
				
				${content.readingTime ? `
					<div ${getStyle('cc-course-duration', settings)}>
						<span>${content.readingTime}</span>
					</div>
				` : ''}
				
				${renderEngagement(this.data.engagement, useSchema, settings)}
				${renderTags(this.data.tags, settings)}
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('course-card', CourseCard);