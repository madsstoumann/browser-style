/* Tracker adapters for <form-flow>. Docs: ../readme.md § Tracking */
export { beacon } from './beacon.js';
export { dataLayer, toDataLayer } from './datalayer.js';

/* One tracker that hands every event to several, e.g. combine(beacon(url), dataLayer()). */
export function combine(...trackers) {
	return Object.assign(event => trackers.forEach(tracker => tracker(event)), {
		flush: () => trackers.forEach(tracker => tracker.flush?.()),
		grant: () => trackers.forEach(tracker => tracker.grant?.()),
		revoke: () => trackers.forEach(tracker => tracker.revoke?.())
	});
}
