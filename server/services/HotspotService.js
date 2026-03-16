import Hotspot from '../models/Hotspot.js';
import { parse } from 'csv-parse/sync';

export class HotspotService {
    constructor() {
        this.model = Hotspot;
        // this.NASA_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/usfs/api';
        this.NASA_BASE_URL =
            'https://firms.modaps.eosdis.nasa.gov/usfs/api/area/csv';
    }

    async fetchHotspots(area = null, days = 1) {
        try {
            // Default to continental US if no area specified
            const bbox = area || '-180, -90, 180, 90';
            const apiKey = 'a2376008b0235d19ec268bbbafb31204';
            const source = 'VIIRS_SNPP_NRT';

            if (!apiKey) {
                throw new Error(
                    'NASA_FIRMS_API_KEY environment variable is required'
                );
            }

            const url = `${this.NASA_BASE_URL}/${apiKey}/${source}/${bbox}/${days}`;
            // https://firms.modaps.eosdis.nasa.gov/usfs/api/area/csv/a2376008b0235d19ec268bbbafb31204/VIIRS_SNPP_NRT/-125,30,-115,50/1/2025-11-17
            // https://firms.modaps.eosdis.nasa.gov/usfs/api/area/csv/a2376008b0235d19ec268bbbafb31204/-125,30,-115,50/2
            console.log(`Fetching NASA FIRMS data from: ${url}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `NASA API responded with status: ${response.status}`
                );
            }

            const csvText = await response.text();

            // Parse CSV data
            const hotspots = this.parseCSVData(csvText);
            console.log(
                `Parsed ${hotspots.length} hotspots from NASA FIRMS CSV`
            );

            return hotspots;
        } catch (error) {
            console.error('Error fetching NASA FIRMS data:', error);
            throw error;
        }
    }

    parseCSVData(csvText) {
        try {
            // Skip empty responses
            if (!csvText || csvText.trim().length === 0) {
                console.warn('Empty response from NASA FIRMS API');
                return [];
            }

            // Parse CSV - NASA FIRMS CSV format has headers
            const records = parse(csvText, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            return records
                .map(record => {
                    // NASA FIRMS CSV columns typically include:
                    // latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, confidence, version, bright_t31, frp, daynight
                    const latitude = parseFloat(record.latitude);
                    const longitude = parseFloat(record.longitude);

                    if (isNaN(latitude) || isNaN(longitude)) {
                        console.warn(
                            'Invalid coordinates in CSV record:',
                            record
                        );
                        return null;
                    }

                    // Create a unique sourceId
                    const sourceId = `${record.latitude}_${record.longitude}_${record.acq_date}_${record.acq_time}`;

                    // Parse date - NASA format: YYYY-MM-DD and HHMM (24h time)
                    const dateStr = record.acq_date;
                    const timeStr = record.acq_time.toString().padStart(4, '0');
                    const acquisitionDate = new Date(
                        `${dateStr}T${timeStr.slice(0, 2)}:${timeStr.slice(
                            2,
                            4
                        )}:00Z`
                    );

                    return {
                        geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
                        },
                        properties: {
                            sourceId: sourceId,
                            brightness: parseFloat(record.brightness) || 0,
                            confidence: parseInt(record.confidence) || 0,
                            satellite: record.satellite || 'VIIRS_SNPP',
                            acquisitionDate: acquisitionDate,
                            scan: parseFloat(record.scan) || 0,
                            track: parseFloat(record.track) || 0,
                            frp: parseFloat(record.frp) || 0,
                            daynight: record.daynight || 'D',
                            source: 'NASA_FIRMS',
                        },
                    };
                })
                .filter(Boolean); // Remove any null entries
        } catch (error) {
            console.error('Error parsing CSV data:', error);
            console.error('CSV sample:', csvText.substring(0, 500)); // Log first 500 chars for debugging
            throw new Error(
                `Failed to parse NASA FIRMS CSV data: ${error.message}`
            );
        }
    }

    // Alternative: Use the KML endpoint if CSV continues to be problematic
    async fetchHotspotsKML(area = null, days = 1) {
        try {
            const bbox = area || '-125,30,-115,50';
            const apiKey = process.env.NASA_FIRMS_API_KEY;

            const url = `${this.NASA_BASE_URL}/kml_fire_footprints/?api_key=${apiKey}&source=VIIRS_SNPP&area=${bbox}&day_range=${days}`;

            console.log(
                `Fetching NASA FIRMS KML data from: ${url.replace(
                    apiKey,
                    '***'
                )}`
            );

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `NASA KML API responded with status: ${response.status}`
                );
            }

            const kmlText = await response.text();
            return this.parseKMLData(kmlText);
        } catch (error) {
            console.error('Error fetching NASA FIRMS KML data:', error);
            throw error;
        }
    }

    parseKMLData(kmlText) {
        // This is a simplified KML parser - you might want to use a proper KML parsing library
        console.warn('KML parsing not yet implemented, using empty array');
        return [];

        // For future implementation, you could use:
        // const parser = new DOMParser();
        // const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
        // Then extract Placemark elements and parse coordinates
    }

    async renewHotspots(area = null, days = 1) {
        try {
            // Try CSV first, fall back to KML if needed
            let nasaHotspots;
            try {
                nasaHotspots = await this.fetchHotspots(area, days);
            } catch (csvError) {
                console.warn('CSV fetch failed, trying KML:', csvError.message);
                nasaHotspots = await this.fetchHotspotsKML(area, days);
            }

            let added = 0,
                updated = 0,
                errors = 0;

            for (const hotspot of nasaHotspots) {
                try {
                    const existing = await this.model.findOne({
                        'properties.sourceId': hotspot.properties.sourceId,
                    });

                    if (existing) {
                        await this.model.updateOne(
                            {
                                'properties.sourceId':
                                    hotspot.properties.sourceId,
                            },
                            {
                                $set: {
                                    ...hotspot,
                                    updatedAt: new Date(),
                                },
                            }
                        );
                        updated++;
                    } else {
                        await this.model.create(hotspot);
                        added++;
                    }
                } catch (error) {
                    errors++;
                    console.error(
                        `Error processing hotspot ${hotspot.properties.sourceId}:`,
                        error
                    );
                }
            }

            // Clean up old hotspots
            const cleanupResult = await this.cleanupOldHotspots();

            console.log(
                `Hotspot renewal complete: ${added} added, ${updated} updated, ${errors} errors, ${cleanupResult.deletedCount} old records cleaned`
            );

            return {
                added,
                updated,
                errors,
                cleaned: cleanupResult.deletedCount,
                totalProcessed: nasaHotspots.length,
            };
        } catch (error) {
            console.error('Error in hotspot renewal process:', error);
            throw error;
        }
    }

    async cleanupOldHotspots(daysThreshold = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await this.model.deleteMany({
            'properties.acquisitionDate': { $lt: cutoffDate },
        });

        if (result.deletedCount > 0) {
            console.log(
                `Cleaned up ${result.deletedCount} hotspots older than ${daysThreshold} days`
            );
        }

        return result;
    }

    async find(query = {}) {
        const dbQuery = this.mapQuery(query);
        let mongooseQuery = this.model.find(dbQuery);

        // Default: most recent first, highest confidence first
        mongooseQuery = mongooseQuery.sort({
            'properties.acquisitionDate': -1,
            'properties.confidence': -1,
        });

        if (query.limit) {
            mongooseQuery = mongooseQuery.limit(parseInt(query.limit));
        }

        if (query.skip) {
            mongooseQuery = mongooseQuery.skip(parseInt(query.skip));
        }

        return mongooseQuery.exec();
    }

    async findOne(sourceId) {
        return this.model.findOne({ 'properties.sourceId': sourceId });
    }

    async create(hotspotData) {
        const newHotspot = new this.model(hotspotData);
        return newHotspot.save();
    }

    async update(sourceId, updateData) {
        return this.model.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date(),
                },
            },
            { new: true, runValidators: true }
        );
    }

    async delete(query = {}) {
        const dbQuery = this.mapQuery(query);

        if (Object.keys(dbQuery).length === 0) {
            throw new Error('Delete query requires filters');
        }

        return this.model.deleteMany(dbQuery);
    }

    mapQuery(apiQuery) {
        const dbQuery = {};

        // Field mappings
        const fieldMap = {
            sourceId: 'properties.sourceId',
            satellite: 'properties.satellite',
            daynight: 'properties.daynight',
        };

        for (const [apiField, dbField] of Object.entries(fieldMap)) {
            if (apiQuery[apiField] !== undefined) {
                dbQuery[dbField] = apiQuery[apiField];
            }
        }

        // Confidence filter
        if (apiQuery.minConfidence) {
            dbQuery['properties.confidence'] = {
                $gte: parseInt(apiQuery.minConfidence),
            };
        }

        // Brightness filter
        if (apiQuery.minBrightness) {
            dbQuery['properties.brightness'] = {
                $gte: parseFloat(apiQuery.minBrightness),
            };
        }

        // Time-based filters
        if (apiQuery.minDate) {
            dbQuery['properties.acquisitionDate'] = {
                $gte: new Date(apiQuery.minDate),
            };
        }

        if (apiQuery.maxDate) {
            dbQuery['properties.acquisitionDate'] = {
                ...dbQuery['properties.acquisitionDate'],
                $lte: new Date(apiQuery.maxDate),
            };
        }

        // Last X hours filter (convenience parameter)
        if (apiQuery.lastHours) {
            const cutoff = new Date(
                Date.now() - parseInt(apiQuery.lastHours) * 60 * 60 * 1000
            );
            dbQuery['properties.acquisitionDate'] = {
                $gte: cutoff,
            };
        }

        return dbQuery;
    }

    async getHotspotStatistics() {
        const [total, highConfidence, recent24h] = await Promise.all([
            this.model.countDocuments(),
            this.model.countDocuments({
                'properties.confidence': { $gte: 80 },
            }),
            this.model.countDocuments({
                'properties.acquisitionDate': {
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            }),
        ]);

        return { total, highConfidence, recent24h };
    }
}

export const hotspotService = new HotspotService();
