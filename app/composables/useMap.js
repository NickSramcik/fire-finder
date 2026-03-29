import { ref, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

// Map-specific logic extracted from FireMap.vue
export function useMap() {
    const map = ref(null);
    const mapLoaded = ref(false);
    const mapError = ref(null);

    const mapConfig = ref({
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-118.243683, 34.052235], // Los Angeles
        zoom: 6,
        minZoom: 3,
        maxZoom: 15,
    });

    const mapIcons = ref([
        { url: '/fire-small.png', name: 'fire-small', size: [24, 24] },
        { url: '/fire-medium.png', name: 'fire-medium', size: [32, 32] },
        { url: '/fire-large.png', name: 'fire-large', size: [40, 40] },
        { url: '/fire-huge.png', name: 'fire-huge', size: [48, 48] },
    ]);

    const addedLayers = ref(new Set());

    // -------------------------------------------------------------------------
    // Map initialization
    // -------------------------------------------------------------------------

    function initializeMap(containerId) {
        const config = useRuntimeConfig();

        if (!config.public.mapboxToken) {
            mapError.value = 'Mapbox token not configured. Please check your environment variables.';
            console.error('Mapbox Token missing!');
            return;
        }

        if (!mapboxgl.supported()) {
            mapError.value = 'WebGL is not enabled on your device or browser. Try enabling hardware acceleration, or open in Chrome.';
            console.error('WebGL not supported');
            return;
        }

        mapboxgl.accessToken = config.public.mapboxToken;

        try {
            map.value = new mapboxgl.Map({
                container: containerId,
                style: mapConfig.value.style,
                center: mapConfig.value.center,
                zoom: mapConfig.value.zoom,
                minZoom: mapConfig.value.minZoom,
                maxZoom: mapConfig.value.maxZoom,
            });

            map.value.on('load', () => {
                mapLoaded.value = true;
                console.log('Map loaded successfully');
            });

            map.value.on('error', e => {
                if (e.error?.message?.includes('does not exist on this map')) {
                    console.warn('Layer ordering issue (non-critical):', e.error.message);
                    return;
                }
                mapError.value = e.error?.message || 'Unknown map error';
                console.error('Map error:', e);
            });
        } catch (err) {
            mapError.value = err.message;
            console.error('Failed to initialize map:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Icons
    // -------------------------------------------------------------------------

    async function loadMapIcons() {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for loading icons');
            return false;
        }

        const loadPromises = mapIcons.value.map(icon => {
            return new Promise((resolve, reject) => {
                map.value.loadImage(icon.url, (error, image) => {
                    if (error) {
                        console.error(`Failed to load icon ${icon.url}:`, error);
                        reject(error);
                    } else {
                        map.value.addImage(icon.name, image);
                        resolve();
                    }
                });
            });
        });

        try {
            await Promise.all(loadPromises);
            console.log('All map icons loaded successfully');
            return true;
        } catch (err) {
            console.error('Failed to load map icons:', err);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Fire layer
    // -------------------------------------------------------------------------

    function addFireLayer(fireData, sourceId = 'fires') {
        if (!map.value || !mapLoaded.value) return;
        if (!fireData?.length) { console.log('No fire data available'); return; }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: fireData.map(fire => ({
                    type: 'Feature',
                    geometry: fire.geometry,
                    properties: fire.properties,
                })),
            };

            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-points`)) map.value.removeLayer(`${sourceId}-points`);
                map.value.removeSource(sourceId);
            }

            map.value.addSource(sourceId, { type: 'geojson', data: geojson });

            map.value.addLayer({
                id: `${sourceId}-points`,
                type: 'symbol',
                source: sourceId,
                layout: {
                    'icon-image': [
                        'case',
                        ['<', ['coalesce', ['get', 'area'], 0], 1000],   'fire-small',
                        ['<', ['coalesce', ['get', 'area'], 0], 10000],  'fire-medium',
                        ['<', ['coalesce', ['get', 'area'], 0], 100000], 'fire-large',
                        'fire-huge',
                    ],
                    'icon-size': 0.1,
                    'icon-allow-overlap': true,
                },
            });

            addedLayers.value.add(`${sourceId}-points`);
            console.log(`Fire layer added with ${fireData.length} features`);
        } catch (err) {
            console.error('Error adding fire layer:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Perimeter layer
    // -------------------------------------------------------------------------

    function addPerimeterLayer(perimeterData, sourceId = 'perimeters') {
        if (!map.value || !mapLoaded.value) return;
        if (!perimeterData?.length) { console.log('No perimeter data available'); return; }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: perimeterData.map(p => ({
                    type: 'Feature',
                    geometry: p.geometry,
                    properties: p.properties,
                })),
            };

            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-fill`)) map.value.removeLayer(`${sourceId}-fill`);
                if (map.value.getLayer(`${sourceId}-outline`)) map.value.removeLayer(`${sourceId}-outline`);
                map.value.removeSource(sourceId);
            }

            map.value.addSource(sourceId, { type: 'geojson', data: geojson });

            map.value.addLayer({
                id: `${sourceId}-fill`,
                type: 'fill',
                source: sourceId,
                paint: { 'fill-color': '#ff5722', 'fill-opacity': 0.4 },
            });

            map.value.addLayer({
                id: `${sourceId}-outline`,
                type: 'line',
                source: sourceId,
                paint: { 'line-color': '#ff5722', 'line-width': 3, 'line-opacity': 0.8 },
            });

            addedLayers.value.add(`${sourceId}-fill`);
            addedLayers.value.add(`${sourceId}-outline`);
            console.log(`Perimeter layer added with ${perimeterData.length} features`);
        } catch (err) {
            console.error('Error adding perimeter layer:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Hotspot layer — heatmap at low zoom, satellite pixel squares at high zoom
    // -------------------------------------------------------------------------

    /**
     * Convert a hotspot center point to an axis-aligned polygon square
     * using the satellite's scan (along-scan km) and track (along-track km) dimensions.
     *
     * Approximations used:
     *   1° latitude  ≈ 110.574 km  (constant)
     *   1° longitude ≈ 111.32 × cos(lat) km  (varies with latitude)
     *
     * These are standard spherical Earth approximations accurate to ~0.3% at
     * mid-latitudes. Pixel rotation along the satellite scan path is not stored
     * in the NASA CSV — squares are axis-aligned (north-up), not orbit-aligned.
     */
    function pointToSquare(lng, lat, scanKm, trackKm) {
        const scan = scanKm || 0.375;  // VIIRS default 375m if missing
        const track = trackKm || 0.375;

        const latRad = lat * Math.PI / 180;
        const halfWidthDeg  = (scan  / 2) / (111.32 * Math.cos(latRad));
        const halfHeightDeg = (track / 2) / 110.574;

        // GeoJSON polygon ring — must close (first = last point)
        return [
            [lng - halfWidthDeg, lat - halfHeightDeg],
            [lng + halfWidthDeg, lat - halfHeightDeg],
            [lng + halfWidthDeg, lat + halfHeightDeg],
            [lng - halfWidthDeg, lat + halfHeightDeg],
            [lng - halfWidthDeg, lat - halfHeightDeg],
        ];
    }

    function addHotspotLayer(hotspotData, sourceId = 'hotspots') {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for adding hotspot layer');
            return;
        }
        if (!hotspotData?.length) {
            console.log('No hotspot data available');
            return;
        }

        const heatSourceId = `${sourceId}-heat-src`;
        const sqSourceId   = `${sourceId}-sq-src`;

        try {
            // Remove existing layers and sources if re-rendering
            for (const layerId of [`${sourceId}-heatmap`, `${sourceId}-squares`, `${sourceId}-sq-outline`]) {
                if (map.value.getLayer(layerId)) map.value.removeLayer(layerId);
            }
            if (map.value.getSource(heatSourceId)) map.value.removeSource(heatSourceId);
            if (map.value.getSource(sqSourceId))   map.value.removeSource(sqSourceId);

            // --- Source 1: Points → heatmap (Mapbox heatmap requires Point geometry) ---
            const pointFeatures = hotspotData.map(h => ({
                type: 'Feature',
                geometry: h.geometry,
                properties: h.properties,
            }));

            map.value.addSource(heatSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: pointFeatures },
            });

            // --- Source 2: Polygons → squares ---
            const squareFeatures = hotspotData.map(h => {
                const [lng, lat] = h.geometry.coordinates;
                const ring = pointToSquare(lng, lat, h.properties.scan, h.properties.track);
                return {
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [ring] },
                    properties: h.properties,
                };
            });

            map.value.addSource(sqSourceId, {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: squareFeatures },
            });

            // --- Heatmap layer (low zoom, fades out as squares appear) ---
            map.value.addLayer({
                id: `${sourceId}-heatmap`,
                type: 'heatmap',
                source: heatSourceId,
                maxzoom: 10,
                paint: {
                    'heatmap-weight': [
                        'interpolate', ['linear'],
                        ['coalesce', ['get', 'brightness'], 300],
                        300, 0, 370, 1,
                    ],
                    'heatmap-intensity': [
                        'interpolate', ['linear'], ['zoom'],
                        0, 1, 9, 3,
                    ],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0,   'rgba(0, 0, 255, 0)',
                        0.2, 'rgba(0, 255, 255, 0.5)',
                        0.4, 'rgba(0, 255, 0, 0.5)',
                        0.6, 'rgba(255, 255, 0, 0.5)',
                        0.8, 'rgba(255, 165, 0, 0.5)',
                        1,   'rgba(255, 0, 0, 0.5)',
                    ],
                    'heatmap-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        0, 2, 9, 20,
                    ],
                    // Cross-fade: heatmap fades out as squares come in
                    'heatmap-opacity': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 0.8, 10, 0,
                    ],
                },
            });

            // --- Square fill layer (high zoom) ---
            map.value.addLayer({
                id: `${sourceId}-squares`,
                type: 'fill',
                source: sqSourceId,
                minzoom: 8,
                paint: {
                    'fill-color': [
                        'interpolate', ['linear'],
                        ['coalesce', ['get', 'brightness'], 300],
                        300, '#ffff00',
                        320, '#ff8000',
                        340, '#ff4000',
                        370, '#ff0000',
                    ],
                    // Cross-fade in as heatmap fades out
                    'fill-opacity': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 0, 10, 0.75,
                    ],
                },
            });

            // --- Square outline (helps distinguish overlapping pixels) ---
            map.value.addLayer({
                id: `${sourceId}-sq-outline`,
                type: 'line',
                source: sqSourceId,
                minzoom: 8,
                paint: {
                    'line-color': '#ffffff',
                    'line-width': 0.5,
                    'line-opacity': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 0, 10, 0.4,
                    ],
                },
            });

            addedLayers.value.add(`${sourceId}-heatmap`);
            addedLayers.value.add(`${sourceId}-squares`);
            addedLayers.value.add(`${sourceId}-sq-outline`);

            console.log(`Hotspot layer added with ${hotspotData.length} features`);
        } catch (err) {
            console.error('Error adding hotspot layer:', err);
        }
    }

    // -------------------------------------------------------------------------
    // Hotspot popup — targets the squares layer
    // -------------------------------------------------------------------------

    function addHotspotPopupInteractivity(sourceId = 'hotspots') {
        if (!map.value) return;

        const layerId = `${sourceId}-squares`;

        map.value.off('click', layerId);
        map.value.off('mouseenter', layerId);
        map.value.off('mouseleave', layerId);

        map.value.on('click', layerId, e => {
            if (!e.features?.length) return;
            document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());

            new mapboxgl.Popup({ closeButton: false, closeOnClick: true, anchor: 'top-left' })
                .setLngLat(e.lngLat)
                .setHTML(createHotspotPopupContent(e.features[0]))
                .addTo(map.value);
        });

        map.value.on('mouseenter', layerId, () => {
            map.value.getCanvas().style.cursor = 'pointer';
        });
        map.value.on('mouseleave', layerId, () => {
            map.value.getCanvas().style.cursor = '';
        });
    }

    function createHotspotPopupContent(feature) {
        const props = feature.properties;
        const date = props.acquisitionDate
            ? new Date(props.acquisitionDate).toLocaleString()
            : 'Unknown';

        return `
      <div class="popup-content">
        <h3 class="font-bold text-lg">🌡️ IR Hotspot</h3>
        <div class="mt-2 space-y-1 text-sm">
          <p><span class="font-semibold">Brightness:</span> ${props.brightness != null ? props.brightness + 'K' : 'N/A'}</p>
          <p><span class="font-semibold">Confidence:</span> ${props.confidence != null ? props.confidence + '%' : 'N/A'}</p>
          <p><span class="font-semibold">Satellite:</span> ${props.satellite ?? 'N/A'}</p>
          <p><span class="font-semibold">Detected:</span> ${date}</p>
          <p><span class="font-semibold">Fire Power:</span> ${props.frp != null ? props.frp + ' MW' : 'N/A'}</p>
          <p><span class="font-semibold">Pixel size:</span> ${props.scan != null ? props.scan + ' × ' + props.track + ' km' : 'N/A'}</p>
        </div>
      </div>
    `;
    }

    // -------------------------------------------------------------------------
    // Toggle hotspot visibility
    // -------------------------------------------------------------------------

    function toggleHotspotLayer(visible = true) {
        if (!map.value) return;
        const visibility = visible ? 'visible' : 'none';

        for (const layerId of ['hotspots-heatmap', 'hotspots-squares', 'hotspots-sq-outline']) {
            if (map.value.getLayer(layerId)) {
                map.value.setLayoutProperty(layerId, 'visibility', visibility);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Fire popup
    // -------------------------------------------------------------------------

    function addPopupInteractivity(sourceId = 'fires') {
        if (!map.value) return;

        const layerId = `${sourceId}-points`;

        map.value.off('click', layerId);
        map.value.off('mouseenter', layerId);
        map.value.off('mouseleave', layerId);

        map.value.on('click', layerId, e => {
            if (!e.features?.length) return;
            document.querySelectorAll('.mapboxgl-popup').forEach(p => p.remove());

            new mapboxgl.Popup({ closeButton: false, closeOnClick: true, anchor: 'top-left' })
                .setLngLat(e.lngLat)
                .setHTML(createPopupContent(e.features[0]))
                .addTo(map.value);
        });

        map.value.on('mouseenter', layerId, () => {
            if (map.value) map.value.getCanvas().style.cursor = 'pointer';
        });
        map.value.on('mouseleave', layerId, () => {
            if (map.value) map.value.getCanvas().style.cursor = '';
        });
    }

    function createPopupContent(feature) {
        const props = feature.properties;
        return `
      <div class="popup-content">
        <h3 class="font-bold text-lg">${props.name || 'Unknown Fire'}</h3>
        <p class="mt-2"><span class="font-semibold">Status:</span> ${props.status || 'Unknown'}</p>
        <p><span class="font-semibold">Containment:</span> ${props.containment != null ? props.containment + '%' : 'Unknown'}</p>
        <p><span class="font-semibold">Area:</span> ${props.area != null ? props.area.toLocaleString() + ' acres' : 'N/A'}</p>
        <p><span class="font-semibold">Last Updated:</span> ${props.lastUpdated ? new Date(props.lastUpdated).toLocaleDateString() : 'Unknown'}</p>
      </div>
    `;
    }

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------

    function destroyMap() {
        if (map.value) {
            try { map.value.remove(); } catch (err) { console.warn('Error removing map:', err); }
            map.value = null;
            mapLoaded.value = false;
            addedLayers.value.clear();
        }
    }

    onUnmounted(() => destroyMap());

    return {
        map,
        mapLoaded,
        mapError,
        mapConfig,
        mapIcons,
        initializeMap,
        loadMapIcons,
        addFireLayer,
        addPerimeterLayer,
        addHotspotLayer,
        addHotspotPopupInteractivity,
        toggleHotspotLayer,
        addPopupInteractivity,
        destroyMap,
    };
}
