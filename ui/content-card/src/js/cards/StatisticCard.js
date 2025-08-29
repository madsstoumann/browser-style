import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class StatisticCard extends BaseCard {
	constructor() {
		super();
		this.classList.add('cc-statistic');
	}

	getTrendIcon(trend) {
		const trendIcons = {
			'up': 'trending_up',
			'down': 'trending_down',
			'stable': 'trending_flat'
		};
		return trendIcons[trend] || 'show_chart';
	}

	getTrendClass(trend) {
		const trendClasses = {
			'up': 'cc-statistic-trend-up',
			'down': 'cc-statistic-trend-down',
			'stable': 'cc-statistic-trend-stable'
		};
		return trendClasses[trend] || 'cc-statistic-trend-neutral';
	}

	formatValue(value) {
		if (typeof value !== 'number') return value;
		
		// Format large numbers with appropriate suffixes
		if (value >= 1000000) {
			return (value / 1000000).toFixed(1) + 'M';
		} else if (value >= 1000) {
			return (value / 1000).toFixed(1) + 'K';
		}
		return value.toLocaleString();
	}

	renderStatisticValue(statisticData, useSchema, settings) {
		const { currentValue, unit, metricName } = statisticData;
		const formattedValue = this.formatValue(currentValue);
		
		return `
			<div ${getStyle('cc-statistic-value', settings)} ${useSchema ? 'itemprop="value" itemscope itemtype="https://schema.org/QuantitativeValue"' : ''}>
				${useSchema ? `<meta itemprop="unitText" content="${unit || ''}">` : ''}
				<span ${getStyle('cc-statistic-number', settings)} ${useSchema ? `itemprop="value" content="${currentValue}"` : ''}>
					${formattedValue}
				</span>
				${unit ? `<span ${getStyle('cc-statistic-unit', settings)}>${unit}</span>` : ''}
				${metricName ? `<div ${getStyle('cc-statistic-metric', settings)} ${useSchema ? 'itemprop="name"' : ''}>${metricName}</div>` : ''}
			</div>
		`;
	}

	renderTrend(statisticData, settings) {
		const { trend, trendPercentage, comparisonPeriod } = statisticData;
		if (!trend) return '';
		
		const icon = this.getTrendIcon(trend);
		const trendClass = this.getTrendClass(trend);
		
		return `
			<div ${getStyle('cc-statistic-trend', settings)} ${getStyle(trendClass, settings)}>
				<div ${getStyle('cc-statistic-trend-info', settings)}>
					${trendPercentage ? `<span ${getStyle('cc-statistic-trend-percent', settings)}>${trendPercentage > 0 ? '+' : ''}${trendPercentage}%</span>` : ''}
					${comparisonPeriod ? `<span ${getStyle('cc-statistic-trend-period', settings)}>${comparisonPeriod}</span>` : ''}
				</div>
			</div>
		`;
	}

	renderTarget(targetValue, currentValue, settings) {
		if (!targetValue) return '';
		
		const progress = Math.min((currentValue / targetValue) * 100, 100);
		const formattedTarget = this.formatValue(targetValue);
		
		return `
			<div ${getStyle('cc-statistic-target', settings)}>
				<div ${getStyle('cc-statistic-target-info', settings)}>
					<span ${getStyle('cc-statistic-target-label', settings)}>Target: ${formattedTarget}</span>
					<span ${getStyle('cc-statistic-target-percent', settings)}>${Math.round(progress)}%</span>
				</div>
				<div ${getStyle('cc-statistic-progress', settings)}>
					<div ${getStyle('cc-statistic-progress-bar', settings)} style="width: ${progress}%"></div>
				</div>
			</div>
		`;
	}

	renderChart(chartData, period, settings) {
		if (!chartData?.length) return '';
		
		// Simple sparkline representation using CSS
		const max = Math.max(...chartData);
		const min = Math.min(...chartData);
		const range = max - min;
		
		return `
			<div ${getStyle('cc-statistic-chart', settings)}>
				<h4 ${getStyle('cc-statistic-chart-title', settings)}>Trend (${period})</h4>
				<div ${getStyle('cc-statistic-sparkline', settings)}>
					${chartData.map((value, index) => {
						const height = range > 0 ? ((value - min) / range) * 100 : 50;
						return `
							<div ${getStyle('cc-statistic-bar', settings)} 
								 style="height: ${height}%" 
								 title="${this.formatValue(value)}">
							</div>
						`;
					}).join('')}
				</div>
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Observation');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { statistic: statisticData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="name"' : ''}>${content.headline}</${headlineTag}>` : ''}
				
				${this.renderStatisticValue(statisticData, useSchema, settings)}
				${this.renderTrend(statisticData, settings)}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderTarget(statisticData.targetValue, statisticData.currentValue, settings)}
				${this.renderChart(statisticData.chartData, statisticData.period, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}
}

customElements.define('statistic-card', StatisticCard);