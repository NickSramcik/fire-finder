import Perimeter from '../models/Perimeter';

// Map API query parameters to database field names
const mapApiQueryToDbQuery = apiQuery => {
    const dbQuery = {};

    if (apiQuery.sourceId) {
        dbQuery['properties.sourceId'] = apiQuery.sourceId;
    }

    if (apiQuery.status) {
        dbQuery['properties.status'] = apiQuery.status;
    }

    return dbQuery;
};

// Get perimeters based on API query parameters
export const getPerimeters = async (apiQuery = {}) => {
    try {
        const dbQuery = mapApiQueryToDbQuery(apiQuery);
        const perimeters = await Perimeter.find(dbQuery);
        return perimeters;
    } catch (error) {
        console.error('Error getting perimeters:', error);
        throw error;
    }
};

// Add a new perimeter
export const addPerimeter = async perimeterData => {
    try {
        const newPerimeter = new Perimeter(perimeterData);
        const savedPerimeter = await newPerimeter.save();
        console.log(`Added perimeter: ${savedPerimeter.properties.name}`);
        return savedPerimeter;
    } catch (error) {
        console.error('Error adding perimeter:', error);
        throw error;
    }
};

// Update a perimeter by sourceId
export const updatePerimeter = async (sourceId, updateData) => {
    try {
        const updatedPerimeter = await Perimeter.findOneAndUpdate(
            { 'properties.sourceId': sourceId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedPerimeter) {
            throw new Error('Perimeter not found');
        }

        console.log(`Updated perimeter: ${updatedPerimeter.properties.name}`);
        return updatedPerimeter;
    } catch (error) {
        console.error('Error updating perimeter:', error);
        throw error;
    }
};

// Delete perimeters based on API query parameters
export const deletePerimeter = async (apiQuery = {}) => {
    try {
        const dbQuery = mapApiQueryToDbQuery(apiQuery);

        // Safety check - don't allow empty queries
        if (Object.keys(dbQuery).length === 0) {
            throw new Error(
                'Delete query must include at least one filter parameter'
            );
        }

        const result = await Perimeter.deleteMany(dbQuery);
        console.log(`Deleted ${result.deletedCount} perimeter(s)`);
        return result;
    } catch (error) {
        console.error('Error deleting perimeter(s):', error);
        throw error;
    }
};

// Renew perimeter data from external source
export const renewPerimeters = async () => {
    try {
        const perimeterData = await fetchPerimeters();
        let added = 0,
            updated = 0,
            failed = [];

        for (const rawPerimeter of perimeterData) {
            const processedPerimeter = processPerimeter(rawPerimeter);
            const sourceId = processedPerimeter.properties.sourceId;
            try {
                const perimeterExists = (await getPerimeters({ sourceId })).length;

                if (perimeterExists) {
                    console.log(
                    );
                    await updatePerimeter(sourceId, processedPerimeter);
                    updated++;
                } else {
                    await addPerimeter(processedPerimeter);
                    added++;
                }
            } catch (error) {
                failed.push(processedPerimeter.properties.name)
                console.error(`Error processing perimeter ${sourceId}:`, error);
            }
        }

        console.log(`Added ${added} perimeters and Updated ${updated} perimeters`)
        if (failed.length) console.log(`Failed to proccess ${failed.length} perimeters: ${failed}`)
        await cleanupOldPerimeters();
        await removeDuplicatePerimeters();
        return { added, updated };
    } catch (error) {
        console.error('Error renewing perimeters:', error);
        throw error;
    }
};

export const validatePolygon = function (coordinates) {
    const ring = coordinates[0];

    if (ring.length < 4) {
        throw new Error('Polygon must have at least 4 points');
    }

    const [x1, y1] = ring[0];
    const [x2, y2] = ring[ring.length - 1];
    if (x1 !== x2 || y1 !== y2) {
        throw new Error('Polygon is not closed');
    }

    const seen = new Set();
    for (const [x, y] of ring) {
        const key = `${x},${y}`;
        const first = `${x1},${y1}`;
        const last = `${x2},${y2}`;
        if (seen.has(key) && key !== first && key !== last) {
            throw new Error(`Duplicate vertex found: ${x},${y}`);
        }
        seen.add(key);
    }
};

export const processPerimeter = rawPerimeter => {
    const processedPerimeter = rawPerimeter;
    rawPerimeter.properties = {
        sourceId: rawPerimeter.properties.attr_UniqueFireIdentifier,
        name: fixName(),
        lastUpdated: new Date(rawPerimeter.properties.poly_DateCurrent)
    }

    return processedPerimeter;

    function fixName() {
        let newName = rawPerimeter.properties.poly_IncidentName.trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        // Add Fire to name if there is no good incident descriptor
        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

        // Check for and clarify prescribed burn jargon
        if (/(Rx|Bp|Pb|Prep|Piles)\b/.test(newName)) {
            newName = newName.replace(/Pb|Rx|Bp/g, match => {
                switch (match) {
                    case 'Pb':
                        return 'Prescribed Burn';
                    case 'Rx':
                        return 'Prescribed Burn';
                    case 'Bp':
                        return 'Burn Piles';
                    default:
                        return match;
                }
            });
        }

        return newName;
    }
};

export const fetchPerimeters = async () => {
    // Fire Perimeter Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=d1c32af3212341869b3c810f1a215824
    const perimeterUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName,poly_DateCurrent,attr_UniqueFireIdentifier&f=pgeojson';

    try {
        const perimeters = await (await fetch(perimeterUrl)).json();
        let perimeterCount = perimeters.features.length;
        console.log(`Fetched ${perimeterCount} Fire Perimeters`);
        return perimeters.features;
    } catch (err) {
        console.error('Error fetching perimeter data:', err);
        throw err;
    }
};

// Clean up old perimeters that haven't been updated
export const cleanupOldPerimeters = async (daysThreshold = 90) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await Perimeter.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });

        console.log(
            `Cleaned up ${result.deletedCount} old perimeters (older than ${daysThreshold} months)`
        );
        return result;
    } catch (error) {
        console.error('Error cleaning up old perimeters:', error);
        throw error;
    }
};

// Remove duplicate perimeters with the same sourceId (keeping the most recent)
export const removeDuplicatePerimeters = async () => {
    try {
        // Find duplicates by grouping by sourceId
        const duplicates = await Perimeter.aggregate([
            {
                $group: {
                    _id: '$properties.sourceId',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' },
                },
            },
            {
                $match: {
                    count: { $gt: 1 },
                },
            },
        ]);

        let deletedCount = 0;

        // For each group of duplicates, keep the most recent and delete others
        for (const group of duplicates) {
            // Sort by newest first
            group.docs.sort(
                (a, b) =>
                    new Date(b.properties.lastUpdated) -
                    new Date(a.properties.lastUpdated)
            );

            // Keep the first (most recent) and delete the rest
            const idsToDelete = group.docs.slice(1).map(doc => doc._id);

            if (idsToDelete.length > 0) {
                const result = await Perimeter.deleteMany({
                    _id: { $in: idsToDelete },
                });
                deletedCount += result.deletedCount;
            }
        }

        console.log(`Removed ${deletedCount} duplicate perimeters`);
        return { deletedCount };
    } catch (error) {
        console.error('Error removing duplicate perimeters:', error);
        throw error;
    }
};
