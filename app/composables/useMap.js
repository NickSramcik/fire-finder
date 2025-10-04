import { ref, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';

// Map-specific logic extracted from FireMap.vue
export function useMap() {
    const map = ref(null);
    const mapLoaded = ref(false);
    const mapError = ref(null);

    // Map configuration - externalized for easy changes
    const mapConfig = ref({
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-118.243683, 34.052235], // Los Angeles
        zoom: 6,
        minZoom: 3,
        maxZoom: 15,
    });

    // Map icons configuration
    const mapIcons = ref([
        { url: '/fire-small.png', name: 'fire-small', size: [24, 24] },
        { url: '/fire-medium.png', name: 'fire-medium', size: [32, 32] },
        { url: '/fire-large.png', name: 'fire-large', size: [40, 40] },
        { url: '/fire-huge.png', name: 'fire-huge', size: [48, 48] },
    ]);

    // Track which layers we've added
    const addedLayers = ref(new Set());

    // Initialize map
    function initializeMap(containerId) {
        const config = useRuntimeConfig();

        if (!config.public.mapboxToken) {
            mapError.value =
                'Mapbox token not configured. Please check your environment variables.';
            console.error('Mapbox Token missing!');
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
                // FIXED: Ignore layer ordering errors, they're not critical
                if (e.error?.message?.includes('does not exist on this map')) {
                    console.warn(
                        'Layer ordering issue (non-critical):',
                        e.error.message
                    );
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

    // Load map icons
    async function loadMapIcons() {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for loading icons');
            return false;
        }

        const loadPromises = mapIcons.value.map(icon => {
            return new Promise((resolve, reject) => {
                map.value.loadImage(icon.url, (error, image) => {
                    if (error) {
                        console.error(
                            `Failed to load icon ${icon.url}:`,
                            error
                        );
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

    // Add fire data to map
    function addFireLayer(fireData, sourceId = 'fires') {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for adding fire layer');
            return;
        }

        if (!fireData || !fireData.length) {
            console.log('No fire data available for layer');
            return;
        }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: fireData.map(fire => ({
                    type: 'Feature',
                    geometry: fire.geometry,
                    properties: fire.properties,
                })),
            };

            // Remove existing source/layer if present
            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-points`)) {
                    map.value.removeLayer(`${sourceId}-points`);
                }
                map.value.removeSource(sourceId);
            }

            // Add source
            map.value.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
            });

            // Add layer
            map.value.addLayer({
                id: `${sourceId}-points`,
                type: 'symbol',
                source: sourceId,
                layout: {
                    'icon-image': [
                        'case',
                        ['<', ['get', 'area'], 1000],
                        'fire-small',
                        ['<', ['get', 'area'], 10000],
                        'fire-medium',
                        ['<', ['get', 'area'], 100000],
                        'fire-large',
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

    // Add perimeter data to map
    function addPerimeterLayer(perimeterData, sourceId = 'perimeters') {
        if (!map.value || !mapLoaded.value) {
            console.log('Map not ready for adding perimeter layer');
            return;
        }

        if (!perimeterData || !perimeterData.length) {
            console.log('No perimeter data available for layer');
            return;
        }

        try {
            const geojson = {
                type: 'FeatureCollection',
                features: perimeterData.map(perimeter => ({
                    type: 'Feature',
                    geometry: perimeter.geometry,
                    properties: perimeter.properties,
                })),
            };

            // Remove existing source/layer if present
            if (map.value.getSource(sourceId)) {
                if (map.value.getLayer(`${sourceId}-fill`)) {
                    map.value.removeLayer(`${sourceId}-fill`);
                }
                if (map.value.getLayer(`${sourceId}-outline`)) {
                    map.value.removeLayer(`${sourceId}-outline`);
                }
                map.value.removeSource(sourceId);
            }

            // Add source
            map.value.addSource(sourceId, {
                type: 'geojson',
                data: geojson,
            });

            // FIXED: Add perimeter layers without beforeId to avoid ordering issues
            // Add fill layer first (will be at bottom)
            map.value.addLayer({
                id: `${sourceId}-fill`,
                type: 'fill',
                source: sourceId,
                paint: {
                    'fill-color': '#ff5722',
                    'fill-opacity': 0.4, // Increased opacity for better visibility
                },
            });

            // Add outline layer
            map.value.addLayer({
                id: `${sourceId}-outline`,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': '#ff5722',
                    'line-width': 3, // Increased width for better visibility
                    'line-opacity': 0.8,
                },
            });

            addedLayers.value.add(`${sourceId}-fill`);
            addedLayers.value.add(`${sourceId}-outline`);
            console.log(
                `Perimeter layer added with ${perimeterData.length} features`
            );
        } catch (err) {
            console.error('Error adding perimeter layer:', err);
        }
    }

    // Add popup interactivity
    function addPopupInteractivity(sourceId = 'fires') {
        if (!map.value) {
            console.log('Map not ready for adding interactivity');
            return;
        }

        const layerId = `${sourceId}-points`;

        // Remove existing event listeners to prevent duplicates
        map.value.off('click', layerId);
        map.value.off('mouseenter', layerId);
        map.value.off('mouseleave', layerId);

        // Click for popup
        map.value.on('click', layerId, e => {
            if (!e.features || e.features.length === 0) return;

            // Remove any existing popups
            document
                .querySelectorAll('.mapboxgl-popup')
                .forEach(popup => popup.remove());

            new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: true,
                anchor: 'top-left',
            })
                .setLngLat(e.lngLat)
                .setHTML(createPopupContent(e.features[0]))
                .addTo(map.value);
        });

        // Cursor changes
        map.value.on('mouseenter', layerId, () => {
            if (map.value) {
                map.value.getCanvas().style.cursor = 'pointer';
            }
        });

        map.value.on('mouseleave', layerId, () => {
            if (map.value) {
                map.value.getCanvas().style.cursor = '';
            }
        });
    }

    function createPopupContent(feature) {
        const props = feature.properties;
        return `
      <div class="popup-content">
        <h3 class="font-bold text-lg">${props.name || 'Unknown Fire'}</h3>
        <p class="mt-2"><span class="font-semibold">Status:</span> ${
            props.status || 'Unknown'
        }</p>
        <p><span class="font-semibold">Containment:</span> ${
            props.containment ? props.containment + '%' : 'Unknown'
        }</p>
        <p><span class="font-semibold">Area:</span> ${
            props.area?.toLocaleString() || 'N/A'
        } acres</p>
        <p><span class="font-semibold">Last Updated:</span> ${
            props.lastUpdated
                ? new Date(props.lastUpdated).toLocaleDateString()
                : 'Unknown'
        }</p>
      </div>
    `;
    }

    // Cleanup
    function destroyMap() {
        if (map.value) {
            try {
                map.value.remove();
            } catch (err) {
                console.warn('Error removing map:', err);
            }
            map.value = null;
            mapLoaded.value = false;
            addedLayers.value.clear();
        }
    }

    // Auto-cleanup on unmount
    onUnmounted(() => {
        destroyMap();
    });

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
        addPopupInteractivity,
        destroyMap,
    };
}
