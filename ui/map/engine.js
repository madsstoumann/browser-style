/**
 * ui-map engine — the only file that touches Leaflet or Supercluster. ui-map.js imports
 * it dynamically, so a page pays for it only when a map scrolls into view.
 * Docs: readme.md § Tiles, § Clustering, § Cascade
 * @version 1.0.0 · @author Mads Stoumann
 */
import * as L from 'leaflet/dist/leaflet-src.esm.js';
import Supercluster from 'supercluster';
/* esbuild --loader:.css=text — the bytes arrive as a STRING, so the three url(images/*.png)
   in leaflet.css are never resolved or copied. None of those three rules can match: we
   build no L.control.layers and every marker carries an explicit divIcon. */
import LEAFLET_CSS from 'leaflet/dist/leaflet.css';

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const CARTO = `${OSM} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

/* Keyless raster basemaps. positron/dark/voyager are the raster twins of the Positron,
   Dark Matter and Voyager styles on openmaptiles.org (those are MapLibre VECTOR styles and
   need an API key). Each record carries its own attribution, so a provider cannot ship
   without one. `osm` is dev/self-host only — the OSMF tile policy forbids a library
   defaulting to it. KEEP IN SYNC with map=tiles in ui/card/data/tokens.json. */
export const TILES = {
	positron: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', maxZoom: 20, subdomains: 'abcd', attribution: CARTO },
	dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', maxZoom: 20, subdomains: 'abcd', attribution: CARTO },
	voyager: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', maxZoom: 20, subdomains: 'abcd', attribution: CARTO },
	osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19, subdomains: 'abc', attribution: OSM },
	topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', maxZoom: 17, subdomains: 'abc', attribution: `${OSM} · map style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)` },
	/* note {z}/{y}/{x} — Esri puts y before x */
	sat: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19, subdomains: 'abc', attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community' }
};

/* leaflet.css goes into a SUB-LAYER an adopted sheet cannot outrank: ui-map.css declares
   `@layer bs-component.leaflet, bs-component.map` so our rules win at zero specificity.
   Adopted sheets are ordered after author sheets, which is why the statement is required. */
let adopted = false;
const adoptLeafletCss = (doc) => {
	if (adopted || !doc.adoptedStyleSheets) return;
	adopted = true;
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(`@layer bs-component.leaflet{${LEAFLET_CSS}}`);
	doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
};

/* The scheme probe. prefers-color-scheme cannot see theme="dark" or .cs-opposite, which
   set `color-scheme` — light-dark() resolves against the COMPUTED value, so one read of a
   registered <color> property answers for the OS preference AND every local override.
   Docs: readme.md § Tiles */
const isDark = (el) => /\b255\b/.test(getComputedStyle(el).getPropertyValue('--ui-map-scheme'));
const resolveTiles = (name, el) => TILES[name] || (name === 'auto' ? (isDark(el) ? TILES.dark : TILES.positron) : TILES.positron);

/* markers are built from page text — never innerHTML with data (AGENTS.md § Security) */
const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/* three count steps so density reads at a glance without a continuous scale */
const clusterSize = (count) => (count >= 100 ? 'lg' : count >= 10 ? 'md' : 'sm');

/* The divIcon element is positioned by Leaflet; the inner <span> is the visual, so our
   `translate` centring composes with that transform instead of fighting it. className
   REPLACES leaflet-div-icon, whose white plate and border would otherwise show through. */
const markerIcon = (html, kind, size) => L.divIcon({
	className: 'ui-map-marker',
	/* null: CSS owns the size */
	iconSize: null,
	html: `<span class="ui-map-pin" data-kind="${kind}"${size ? ` data-size="${size}"` : ''}>${html}</span>`
});

const pointLabel = (point, pin) => {
	if (pin === 'label') return esc(point.name || '');
	if (pin === 'price') return esc(point.price || point.name || '');
	return '';
};

export function createMap(canvas, config, points) {
	adoptLeafletCss(canvas.ownerDocument);

	const host = canvas.parentElement;
	const tiles = resolveTiles(config.tiles, host || canvas);
	const still = config.reducedMotion;

	const map = L.map(canvas, {
		attributionControl: true,
		keyboard: false,
		zoomControl: config.controls !== 'non',
		scrollWheelZoom: config.scroll,
		/* reduced motion, belt: Leaflet's own tweens off at the source. The braces are the
		   @media arm in ui-map.css, which also covers a mid-session preference change. */
		fadeAnimation: !still,
		inertia: !still,
		markerZoomAnimation: !still,
		zoomAnimation: !still
	});

	const layer = L.tileLayer(tiles.url, {
		attribution: tiles.attribution,
		detectRetina: true,
		maxZoom: tiles.maxZoom,
		subdomains: tiles.subdomains || 'abc'
	}).addTo(map);

	/* Hide the DECORATION, not the whole canvas. Tiles, markers and tooltips duplicate the
	   visible list, so .leaflet-map-pane is aria-hidden — but the control container is its
	   SIBLING and stays exposed, because the attribution links are required by the tile
	   licences and must be reachable. Nothing focusable is left inside the hidden subtree:
	   keyboard:false drops the container's and every marker's tabindex, and we create
	   tooltips (inert) rather than popups (which ship a close button).
	   Docs: readme.md § Accessibility */
	map.getPane('mapPane')?.setAttribute('aria-hidden', 'true');

	/* tiles(auto) swaps the template on the EXISTING layer — setUrl keeps the old tiles
	   visible until the new ones load. Stacking two layers and hiding one in CSS would
	   double every tile request. */
	let watch = null;
	let current = tiles;
	const applyScheme = () => {
		const next = resolveTiles('auto', host || canvas);
		if (next === current) return;
		map.attributionControl.removeAttribution(current.attribution);
		map.attributionControl.addAttribution(next.attribution);
		current = next;
		layer.setUrl(next.url);
	};
	if (config.tiles === 'auto') {
		watch = matchMedia('(prefers-color-scheme: dark)');
		watch.addEventListener('change', applyScheme);
	}

	const markers = L.layerGroup().addTo(map);
	const index = config.cluster && points.length
		? new Supercluster({ radius: config.clusterRadius, maxZoom: tiles.maxZoom - 3, minPoints: 2 })
			.load(points.map((point, id) => ({
				type: 'Feature',
				id,
				properties: { id },
				geometry: { type: 'Point', coordinates: [point.lon, point.lat] }
			})))
		: null;

	const emit = (name, detail) => host?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));

	const addPoint = (point) => {
		const marker = L.marker([point.lat, point.lon], {
			icon: markerIcon(pointLabel(point, config.pin), 'point'),
			keyboard: false
		});
		if (point.name) marker.bindTooltip(esc(point.name), { direction: 'top' });
		marker.on('click', () => emit('ui-map:select', { point }));
		marker.addTo(markers);
	};

	const draw = () => {
		markers.clearLayers();
		if (!index) { points.forEach(addPoint); return; }
		const b = map.getBounds();
		for (const feature of index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.round(map.getZoom()))) {
			const [lon, lat] = feature.geometry.coordinates;
			const props = feature.properties;
			if (!props.cluster) { addPoint(points[props.id]); continue; }
			L.marker([lat, lon], {
				icon: markerIcon(esc(props.point_count_abbreviated), 'cluster', clusterSize(props.point_count)),
				keyboard: false
			})
				.on('click', () => map.setView([lat, lon], index.getClusterExpansionZoom(props.cluster_id), { animate: !still }))
				.addTo(markers);
		}
	};

	map.on('moveend zoomend', draw);

	const bounds = points.length ? L.latLngBounds(points.map((p) => [p.lat, p.lon])) : null;
	if (config.fit && bounds) map.fitBounds(bounds, { animate: false, padding: [24, 24] });
	else if (config.lat !== null && config.lon !== null) map.setView([config.lat, config.lon], config.zoom ?? 13, { animate: false });
	else if (bounds) map.setView(bounds.getCenter(), config.zoom ?? 4, { animate: false });
	else map.setView([0, 0], config.zoom ?? 2, { animate: false });

	draw();

	return {
		map,
		/* the frame can be zero-sized at init under content-visibility:auto or a hidden
		   ancestor — ui-map.js calls this from a ResizeObserver on the first non-zero tick */
		resize: () => map.invalidateSize({ animate: false }),
		focus: (i) => {
			const point = points[i];
			if (point) map.setView([point.lat, point.lon], Math.max(map.getZoom(), 12), { animate: !still });
		},
		refresh: applyScheme,
		destroy: () => { watch?.removeEventListener('change', applyScheme); map.remove(); }
	};
}
