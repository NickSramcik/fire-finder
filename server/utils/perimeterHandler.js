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
        // Implement your perimeter renewal logic here
        // This would be similar to renewFires but for perimeters
        console.log('Renewing perimeters...');

        // Placeholder implementation
        return { added: 0, updated: 0 };
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

export const fetchPerimeters = async () => {
    // Fire Perimeter Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=d1c32af3212341869b3c810f1a215824
    const perimeterUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName&f=pgeojson&token=';

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
