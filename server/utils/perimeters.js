import Perimeter from '../models/Perimeter';

// Renew Perimeter Data

export const renewPerimeters = async () => {
    try {
        const perimeterData = await fetchPerimeters();
        let added = 0,
            updated = 0;

        for (let perimeter of perimeterData) {
            perimeter = processPerimeter(perimeter);
            const name = perimeter.properties.name;
            console.log(`Handling perimeter: ${name}`);
            const perimeterExists = await Perimeter.findOne({
                'properties.name': name,
            });

            if (perimeterExists) {
                console.log('Perimeter exists, updating...');
                console.log(
                    'coord:',
                    Array.isArray(perimeter.geometry.coordinates),
                    Array.isArray(perimeter.geometry.coordinates[0])
                );
                await updatePerimeter(name, perimeter);
                updated++;
            } else {
                console.log('Perimieter does not exist, adding...');
                await addPerimeter(perimeter);
                added++;
            }
        }

        console.log(
            `Added ${added} fire perimeters and Updated ${updated} fire perimeters`
        );
        return { added, updated };
    } catch (err) {
        console.error('Error renewing perimeters: ', err);
        throw err;
    }
};

export const addPerimeter = async perimeter => {
    try {
        console.log('Attempting to add: ', perimeter.properties.name);
        console.log(
            'coord:',
            Array.isArray(perimeter.geometry.coordinates),
            Array.isArray(perimeter.geometry.coordinates[0])
        );
        const newPerimeter = new Perimeter(perimeter);
        const savedPerimeter = await newPerimeter.save();

        console.log(`Added perimeter ${perimeter.properties.name}`);
        return { status: 201, data: savedPerimeter };
    } catch (err) {
        console.error('Error adding perimeter: ', err);
        throw err;
    }
};

export const updatePerimeter = async (name, perimeter) => {
    try {
        const query = { 'properties.name': name };
        const update = perimeter;
        const options = { new: true, runValidators: true };

        console.log('Attempting to update: ', perimeter.properties.name);
        console.log(
            'coord:',
            Array.isArray(perimeter.geometry.coordinates),
            Array.isArray(perimeter.geometry.coordinates[0])
        );

        const updatedPerimeter = await Perimeter.findOneAndUpdate(
            query,
            update,
            options
        );

        if (!updatedPerimeter) {
            throw new Error('Fire perimeter not found');
        }

        // console.log(`Updated fire perimeter: ${updatedPerimeter._id}`);
        return updatedPerimeter;
    } catch (err) {
        console.error('Error updating perimeter: ', err);
        throw err;
    }
};

export const deletePerimeter = async query => {
    try {
        const deletedCount = await Perimeter.deleteMany(query);

        return { status: 201, data: deletedCount };
    } catch (err) {
        console.error('Error deleting perimeter: ', err);
        throw err;
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

export const processPerimeter = function (perimeter) {
    const name = perimeter.properties.poly_IncidentName;
    try {
        validatePolygon(perimeter.geometry.coordinates);
    } catch (err) {
        console.error(`Polygon from '${name}' is invalid: ${err}`);
    }

    const cleanedGeometry = cleanGeometry(perimeter.geometry);

    return {
        type: 'Feature',
        geometry: cleanedGeometry,
        properties: {
            name: name,
        },
    };
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
