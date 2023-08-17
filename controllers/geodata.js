// This controller handles automatic fire perimeter & point data collection and processing

const GeoJson = require('../models/GeoJson');
const Fire = require('../models/Fire');

async function deletePerimeter(geoJsonName) {
    try {
        // Delete geojson from database
        await GeoJson.deleteMany({ dataName: geoJsonName });
        console.log('Deleted Perimeter GeoJson');
    } catch (err) {
        console.log(err);
    }
}

async function uploadPerimeter(geojson) {
    try {
        // Delete old Fire Perimeter data
        await deletePerimeter('autoPerimeter');
        let perimeterCount = 0;
        // Split feature collection into individual features
        geojson['features'].forEach(feature => {
            perimeterCount++
            // Upload new Fire Perimeter data to database
            GeoJson.create({
            dataName: 'autoPerimeter',
            geoJsonData: feature,
            // user: req.user.id,
            // userName: req.user.userName,
        });
        })

        console.log(`${perimeterCount} points of Fire Perimeter GeoJson data have been added!`);
    } catch (err) {
        console.log(err);
    }
}

async function fetchPerimeterData() {
    // Fire Perimeter Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=d1c32af3212341869b3c810f1a215824
    const perimeterUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName&f=pgeojson&token=';

    try {
        const geodata = await (await fetch(perimeterUrl)).json();
        await uploadPerimeter(geodata);
    } catch (err) {
        console.log(err);
    }
}

async function deletePoints(user) {
    try {
        // Delete geojson from database
        await Fire.deleteMany({ userName: user });
        console.log(`Deleted Fire Points created by ${user}`);
    } catch (err) {
        console.log(err);
    }
}

async function addFire(firePoint) {
    try {
        let totalBehavior = `${firePoint.properties.FireBehaviorGeneral},${firePoint.properties.FireBehaviorGeneral1},${firePoint.properties.FireBehaviorGeneral2},${firePoint.properties.FireBehaviorGeneral3}`;
        // Clean up fire behavior data, remove nulls & duplicates
        totalBehavior = totalBehavior
            .split(',')
            .filter((e, i, a) => e != 'null' && i == a.indexOf(e))
            .join(', ');
        // If no fire behavior data is present, give it value 'unknown'
        if (!totalBehavior) totalBehavior = 'Unknown';

        // Organize fire names. Add fire if there is no title. Standarize capitalization.
        let newName = firePoint.properties.IncidentName.trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

        let newFireCause = firePoint.properties.FireCause;

        // Check for prescribed burns, fix jargon and set fire cause
        if (/(Rx|Bp|Pb|Prep|Piles)\b/.test(newName)) {
            newFireCause = 'Prescribed';

            newName = newName.replace(/Pb|Rx|Bp/g, match => {
                switch (match) {
                    case 'Pb':
                        return 'Prescribed Burn';
                    case 'Rx':
                        return 'Prescribed Burn';
                    case 'Bp':
                        return 'Burn Piles';
                }
            });
        }

        // Fix discovery date
        let newDate = new Date(
            firePoint.properties.FireDiscoveryDateTime
        ).toString();

        // Add each point to the database as a fire object
        await Fire.create({
            fireName: newName,
            latitude: firePoint.geometry.coordinates[1],
            longitude: firePoint.geometry.coordinates[0],
            fireSize: firePoint.properties.IncidentSize,
            fireBehavior: totalBehavior,
            fireCause: newFireCause,
            discoveryDate: newDate,
            percentContained: firePoint.properties.PercentContained,
            userName: 'system-auto',
        });
    } catch (err) {
        console.log(err);
    }
}

async function fetchPointData() {
    // Fire Point Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=4181a117dc9e43db8598533e29972015
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

    try {
        const fireData = await (await fetch(firePointUrl)).json();
        console.log(fireData);
        let fireCount = 0;
        for (point of fireData.features) {
            // console.log(`Adding ${point.attributes.IncidentName}`)
            await addFire(point);
            fireCount++;
        }

        console.log(`Added ${fireCount} Fire Points`);
    } catch (err) {
        console.log(err);
    }
}

async function getGeoData() {
    try {
        await deletePoints('system-auto');
        await fetchPointData();
        await fetchPerimeterData();
    } catch (err) {
        console.log(err);
    }
}

async function refreshGeoJson(req, res) {
    try {
        console.log('Refreshing GeoJson...');
        const result = await getGeoData();
        res.send(result);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    refreshGeoJson,
};
