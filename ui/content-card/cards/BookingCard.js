import { BaseCard } from '../base/BaseCard.js';
import { getStyle, renderActions, renderLinks, renderMedia } from '../base/utils.js';

export class BookingCard extends BaseCard {
	constructor() {
		super();
	}

	renderVenueInfo(bookingData, useSchema, settings) {
		const { serviceName, venue, capacity } = bookingData;
		const info = [];
		
		if (venue) {
			info.push(`
				<div ${getStyle('cc-booking-info-item', settings)} ${useSchema ? 'itemprop="provider" itemscope itemtype="https://schema.org/Organization"' : ''}>
					<span class="material-icons">business</span>
					<span ${useSchema ? 'itemprop="name"' : ''}>${venue}</span>
				</div>
			`);
		}
		
		if (capacity) {
			info.push(`
				<div ${getStyle('cc-booking-info-item', settings)}>
					<span class="material-icons">group</span>
					<span>Capacity: ${capacity} people</span>
				</div>
			`);
		}
		
		if (serviceName && serviceName !== this.data.content?.headline) {
			info.push(`
				<div ${getStyle('cc-booking-info-item', settings)}>
					<span class="material-icons">room_service</span>
					<span ${useSchema ? 'itemprop="name"' : ''}>${serviceName}</span>
				</div>
			`);
		}
		
		if (!info.length) return '';
		
		return `
			<div ${getStyle('cc-booking-info', settings)}>
				${info.join('')}
			</div>
		`;
	}

	renderPricing(price, duration, useSchema, settings) {
		if (!price) return '';
		
		const { hourlyRate, currency } = price;
		const currencySymbol = currency === 'USD' ? '$' : currency;
		
		return `
			<div ${getStyle('cc-booking-pricing', settings)}>
				${useSchema ? `<meta itemprop="priceCurrency" content="${currency || 'USD'}">` : ''}
				${useSchema ? `<meta itemprop="totalPrice" content="${hourlyRate}">` : ''}
				<div ${getStyle('cc-booking-price', settings)}>
					<span class="material-icons">attach_money</span>
					<div ${getStyle('cc-booking-price-info', settings)}>
						<span ${getStyle('cc-booking-rate', settings)}>
							${currencySymbol}${hourlyRate}/hour
						</span>
						${duration ? `<span ${getStyle('cc-booking-duration', settings)}>Minimum: ${duration}</span>` : ''}
					</div>
				</div>
			</div>
		`;
	}

	renderAvailableSlots(availableSlots, settings) {
		if (!availableSlots?.length) return '';
		
		return `
			<div ${getStyle('cc-booking-availability', settings)}>
				<h4 ${getStyle('cc-booking-availability-title', settings)}>Available Times</h4>
				<div ${getStyle('cc-booking-slots', settings)}>
					${availableSlots.map(slot => {
						const date = new Date(slot.date);
						return `
							<div ${getStyle('cc-booking-slot-group', settings)}>
								<div ${getStyle('cc-booking-date', settings)}>
									<span class="material-icons">event</span>
									<span>${date.toLocaleDateString()}</span>
								</div>
								<div ${getStyle('cc-booking-times', settings)}>
									${slot.times?.map(time => `
										<button type="button" ${getStyle('cc-booking-time-slot', settings)} data-date="${slot.date}" data-time="${time}">
											${time}
										</button>
									`).join('') || ''}
								</div>
							</div>
						`;
					}).join('')}
				</div>
			</div>
		`;
	}

	renderAmenities(amenities, settings) {
		if (!amenities?.length) return '';
		
		return `
			<div ${getStyle('cc-booking-amenities', settings)}>
				<h4 ${getStyle('cc-booking-amenities-title', settings)}>Included Amenities</h4>
				<div ${getStyle('cc-booking-amenities-list', settings)}>
					${amenities.map(amenity => `
						<div ${getStyle('cc-booking-amenity', settings)}>
							<span class="material-icons">check</span>
							<span>${amenity}</span>
						</div>
					`).join('')}
				</div>
			</div>
		`;
	}

	renderPolicies(bookingData, settings) {
		const policies = [];
		
		if (bookingData.cancellationPolicy) {
			policies.push(`
				<div ${getStyle('cc-booking-policy', settings)}>
					<span class="material-icons">policy</span>
					<div ${getStyle('cc-booking-policy-info', settings)}>
						<strong>Cancellation Policy</strong>
						<p>${bookingData.cancellationPolicy}</p>
					</div>
				</div>
			`);
		}
		
		if (bookingData.specialRequests) {
			policies.push(`
				<div ${getStyle('cc-booking-policy', settings)}>
					<span class="material-icons">support_agent</span>
					<div ${getStyle('cc-booking-policy-info', settings)}>
						<strong>Special Requests</strong>
						<p>${bookingData.specialRequests}</p>
					</div>
				</div>
			`);
		}
		
		if (!policies.length) return '';
		
		return `
			<div ${getStyle('cc-booking-policies', settings)}>
				<h4 ${getStyle('cc-booking-policies-title', settings)}>Policies & Information</h4>
				${policies.join('')}
			</div>
		`;
	}

	render() {
		const renderContext = this._setSchema('Reservation');
		if (!renderContext) return '';
		
		const { settings, useSchema, content, headlineTag } = renderContext;
		const { booking: bookingData = {} } = this.data;

		return `
			${this.data.media ? renderMedia(this.data.media, this.data.ribbon, this.data.sticker, useSchema, settings) : ''}
			<div ${getStyle('cc-content', settings)}>
				${content.headline ? `<${headlineTag} ${getStyle('cc-headline', settings)} ${useSchema ? 'itemprop="reservationFor" itemscope itemtype="https://schema.org/Service"' : ''}>${useSchema ? `<span itemprop="name">${content.headline}</span>` : content.headline}</${headlineTag}>` : ''}
				
				${content.summary ? `<p ${getStyle('cc-summary', settings)} ${useSchema ? 'itemprop="description"' : ''}>${content.summary}</p>` : ''}
				
				${this.renderVenueInfo(bookingData, useSchema, settings)}
				${this.renderPricing(bookingData.price, bookingData.duration, useSchema, settings)}
				${this.renderAvailableSlots(bookingData.availableSlots, settings)}
				${this.renderAmenities(bookingData.amenities, settings)}
				${this.renderPolicies(bookingData, settings)}
				
				${renderLinks(this.data.links, settings, this.data.actions)}
				${renderActions(this.data.actions, useSchema, settings)}
			</div>
		`;
	}

	connectedCallback() {
		super.connectedCallback();
		
		// Add click handlers for time slots
		this.addEventListener('click', this.handleTimeSlotClick.bind(this));
	}

	handleTimeSlotClick(event) {
		if (!event.target.matches('.cc-booking-time-slot')) return;
		
		// Remove active state from other slots
		this.querySelectorAll('.cc-booking-time-slot').forEach(slot => {
			slot.classList.remove('cc-booking-time-slot-active');
		});
		
		// Add active state to clicked slot
		event.target.classList.add('cc-booking-time-slot-active');
		
		// Store selected booking info
		const selectedDate = event.target.dataset.date;
		const selectedTime = event.target.dataset.time;
		
		// Dispatch custom event for booking selection
		this.dispatchEvent(new CustomEvent('booking-slot-selected', {
			detail: { date: selectedDate, time: selectedTime },
			bubbles: true
		}));
	}
}

customElements.define('booking-card', BookingCard);