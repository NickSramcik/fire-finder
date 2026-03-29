import { parse } from 'csv-parse/sync';
import Hotspot from '../models/Hotspot.js';
import { logActivity } from '../utils/logger.js';

// US bounding box for area queries
const US_BBOX = '-125,24,-65,50';

export class HotspotService {
    constructor() {
        this.baseUrl = 'https://firms.modaps.eosdis.nasa.gov/usfs/api/area/csv';
    }

    // Read lazily so Nuxt runtime config is fully initialized before first use
    get nasaKey() {
        const key = process.env.NASA_KEY;
        if (!key)
            throw new Error('NASA_KEY environment variable is not set');
        return key;
    }

    // -------------------------------------------------------------------------
    // Fetch & Renewal
    // -------------------------------------------------------------------------

    async fetchHotspots(area = US_BBOX, days = 1) {
        // Fetch from both VIIRS (375m) and MODIS (1km) for coverage
        const sources = ['VIIRS_SNPP_NRT', 'MODIS_NRT'];
        const results = await Promise.allSettled(
            sources.map(source => this._fetchSource(source, area, days))
        );

        const hotspots = [];
        for (const result of results) {
            if (result.status === 'fulfilled') {
                hotspots.push(...result.value);
            } else {
                console.warn('NASA source fetch failed:', result.reason?.message);
            }
        }

        return hotspots;
    }

    async _fetchSource(source, area, days) {
        const url = `${this.baseUrl}/${this.nasaKey}/${source}/${area}/${days}`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            throw new Error(`NASA ${source} returned ${response.status}`);
        }

        const csvText = await response.text();

        // NASA returns a plain error string on auth failure rather than HTTP 4xx
        if (!csvText.startsWith('latitude') && !csvText.startsWith('lon')) {
            throw new Error(
                `Unexpected NASA response for ${source}: ${csvText.slice(0, 100)}`
            );
        }

        return this.parseCSVData(csvText);
    }

    parseCSVData(csvText) {
        const rows = parse(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });

        const hotspots = [];
        for (const row of rows) {
            try {
                const hotspot = this._rowToHotspot(row);
                if (hotspot) hotspots.push(hotspot);
            } catch (err) {
                // Skip malformed rows — NASA data can have gaps
                console.warn('Skipping malformed NASA row:', err.message);
            }
        }

        return hotspots;
    }

    _rowToHotspot(row) {
        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);

        if (isNaN(lat) || isNaN(lng)) return null;

        // VIIRS uses bright_ti4, MODIS uses brightness — normalize to one field
        const brightness = parseFloat(row.bright_ti4 ?? row.brightness);

        // Deterministic sourceId from position + acquisition time
        const sourceId = `${row.acq_date}_${row.acq_time}_${lat}_${lng}`;

        // VIIRS returns 'l'/'n'/'h', MODIS returns 0-100
        const confidence = this._parseConfidence(row.confidence);

        // acq_date: "2024-01-15", acq_time: "0142"
        const acquisitionDate = this._parseAcquisitionDate(row.acq_date, row.acq_time);

        return {
            geometry: {
                type: 'Point',
                coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
            },
            properties: {
                sourceId,
                brightness: isNaN(brightness) ? null : brightness,
                confidence,
                satellite: row.satellite ?? null,
                acquisitionDate,
                scan: parseFloat(row.scan) || null,
                track: parseFloat(row.track) || null,
                frp: parseFloat(row.frp) || null,
                daynight: row.daynight ?? null,
                source: 'NASA',
            },
        };
    }

    _parseConfidence(raw) {
        if (raw === null || raw === undefined || raw === '') return null;

        // VIIRS categorical: 'l' = low (~30), 'n' = nominal (~50), 'h' = high (~80)
        const categorical = { l: 30, n: 50, h: 80 };
        if (categorical[raw.toLowerCase()])
            return categorical[raw.toLowerCase()];

        const numeric = parseInt(raw);
        return isNaN(numeric) ? null : numeric;
    }

    _parseAcquisitionDate(dateStr, timeStr) {
        if (!dateStr) return null;

        const time = String(timeStr ?? '0000').padStart(4, '0');
        const hours = time.slice(0, 2);
        const minutes = time.slice(2, 4);

        const date = new Date(`${dateStr}T${hours}:${minutes}:00Z`);
        return isNaN(date.getTime()) ? null : date;
    }

    async renewHotspots(area = null, days = 1, trigger = 'auto') {
        const targetArea = area || US_BBOX;
        console.log(`Fetching hotspots from NASA (area: ${targetArea}, days: ${days})...`);

        let hotspots;
        try {
            hotspots = await this.fetchHotspots(targetArea, days);
        } catch (err) {
            await logActivity({
                type: 'error',
                source: 'hotspot',
                trigger,
                message: `Hotspot fetch failed: ${err.message}`,
                details: { error: err.message },
            });
            throw err;
        }

        if (!hotspots.length) {
            const message = 'NASA returned 0 hotspots — skipping renewal';
            console.warn(message);
            await logActivity({
                type: 'error',
                source: 'hotspot',
                trigger,
                message,
                details: { area: targetArea, days },
            });
            return { added: 0, updated: 0, total: 0 };
        }

        console.log(`Processing ${hotspots.length} hotspots...`);

        const ops = hotspots.map(h => ({
            updateOne: {
                filter: { 'properties.sourceId': h.properties.sourceId },
                update: { $set: h },
                upsert: true,
            },
        }));

        let result;
        try {
            result = await Hotspot.bulkWrite(ops, { ordered: false });
        } catch (err) {
            await logActivity({
                type: 'error',
                source: 'hotspot',
                trigger,
                message: `Hotspot DB write failed: ${err.message}`,
                details: { error: err.message, total: hotspots.length },
            });
            throw err;
        }

        const added = result.upsertedCount ?? 0;
        const updated = result.modifiedCount ?? 0;

        console.log(`Hotspots renewed — added: ${added}, updated: ${updated}`);

        await logActivity({
            type: 'success',
            source: 'hotspot',
            trigger,
            message: `Hotspot renewal complete — ${added} added, ${updated} updated`,
            details: { added, updated, total: hotspots.length, days },
        });

        return { added, updated, total: hotspots.length };
    }

    async resetHotspots(days = 7) {
        console.log(`Resetting hotspot data — deleting all and re-fetching ${days} days...`);

        const deleteResult = await Hotspot.deleteMany({});
        const deleted = deleteResult.deletedCount ?? 0;
        console.log(`Deleted ${deleted} existing hotspots`);

        // renewHotspots will log its own success/error — log the reset wrapper here
        const renewResult = await this.renewHotspots(null, days, 'manual');

        await logActivity({
            type: 'reset',
            source: 'hotspot',
            trigger: 'manual',
            message: `IR data reset — deleted ${deleted}, re-fetched ${days} days from NASA`,
            details: { deleted, days, ...renewResult },
        });

        return { deleted, ...renewResult };
    }

    async cleanupOldHotspots(daysThreshold = 7) {
        const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);
        const result = await Hotspot.deleteMany({
            'properties.acquisitionDate': { $lt: cutoff },
        });
        console.log(`Cleaned up ${result.deletedCount} hotspots older than ${daysThreshold} days`);
        return result;
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    async find(query = {}) {
        const filter = this.mapQuery(query);
        return Hotspot.find(filter).lean();
    }

    async findOne(sourceId) {
        return Hotspot.findOne({ 'properties.sourceId': sourceId }).lean();
    }

    async create(hotspotData) {
        const hotspot = new Hotspot(hotspotData);
        return hotspot.save();
    }

    async update(sourceId, updateData) {
        return Hotspot.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            { $set: updateData },
            { new: true }
        ).lean();
    }

    async delete(query = {}) {
        const filter = this.mapQuery(query);
        return Hotspot.deleteMany(filter);
    }

    async getHotspotStatistics() {
        const total = await Hotspot.countDocuments();
        const recent = await Hotspot.countDocuments({
            'properties.acquisitionDate': {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
        });
        const highConfidence = await Hotspot.countDocuments({
            'properties.confidence': { $gte: 80 },
        });

        return { total, recent, highConfidence };
    }

    // -------------------------------------------------------------------------
    // Query mapping
    // -------------------------------------------------------------------------

    mapQuery(apiQuery = {}) {
        const filter = {};

        if (apiQuery.minConfidence) {
            filter['properties.confidence'] = { $gte: parseInt(apiQuery.minConfidence) };
        }
        if (apiQuery.minBrightness) {
            filter['properties.brightness'] = { $gte: parseFloat(apiQuery.minBrightness) };
        }
        if (apiQuery.satellite) {
            filter['properties.satellite'] = apiQuery.satellite;
        }
        if (apiQuery.hours) {
            const cutoff = new Date(Date.now() - parseInt(apiQuery.hours) * 60 * 60 * 1000);
            filter['properties.acquisitionDate'] = { $gte: cutoff };
        }

        return filter;
    }
}

export const hotspotService = new HotspotService();
