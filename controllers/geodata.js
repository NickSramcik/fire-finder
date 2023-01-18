// This controller handles automatic fire perimeter & point data collection and processing 

const GeoJson = require("../models/GeoJson");
const Fire = require("../models/Fire");


async function deletePerimeter(geoJsonName) {
    try {
        // Delete geojson from database
        await GeoJson.deleteMany({ dataName: geoJsonName });
        console.log("Deleted Perimeter GeoJson");
    } catch (err) {
        console.log(err);
    };
};

async function uploadPerimeter(geojson) {
    try {
        // Delete old Fire Perimeter data
        await deletePerimeter('autoPerimeter');
        // Upload new Fire Perimeter data to database
        await GeoJson.create({
          dataName: 'autoPerimeter',
          geoJsonData: geojson,
          // user: req.user.id,
          // userName: req.user.userName,
        });
      console.log("Fire Perimeter GeoJson data has been added!");
    } catch (err) {
        console.log(err);
    };
};

async function fetchPerimeterData() {
    // Fire Perimeter Data from NIFC
    // Visit https://data-nifc.opendata.arcgis.com/datasets/nifc::wfigs-current-wildland-fire-perimeters/about
    const perimeterUrl = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Current_WildlandFire_Perimeters/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName&outSR=4326&f=geojson'
    
    try {
        const geodata = await (await fetch(perimeterUrl)).json();
        await uploadPerimeter(geodata);
    } catch (err) {
        console.log(err);
    };
};

async function deletePoints(user) {
    try {
        // Delete geojson from database
        await Fire.deleteMany({ userName: user });
        console.log(`Deleted Fire Points created by ${user}`);
    } catch (err) {
        console.log(err);
    };
};

async function addFire(firePoint) {
    try {
        let totalBehavior = 
        `${firePoint.properties.FireBehaviorGeneral},${firePoint.properties.FireBehaviorGeneral1},${firePoint.properties.FireBehaviorGeneral2},${firePoint.properties.FireBehaviorGeneral3}`;
        // Clean up fire behavior data, remove nulls & duplicates
        totalBehavior = totalBehavior.split(',').filter((e, i, a) => e != 'null' && i == a.indexOf(e)).join(', ');
        // If no fire behavior data is present, give it value 'unknown'
        if (!totalBehavior) totalBehavior = 'Unknown';
        
        // Take the complex name if it exists, otherwise use incident name
        let newName = firePoint.properties.IncidentName;
        // Standardize capitalization and trim empty spaces
        newName = newName.trim().toLowerCase().split(' ').filter(e => e)
                         .map(e => e[0].toUpperCase() + e.slice(1)).join(' ');
        // Add fire to end of name if it's not already there
        if (!newName.includes('Fire') && 
            !newName.includes('Complex')) {
                newName += ' Fire'
        };

        // Fix discovery date
        let newDate = (new Date(firePoint.properties.FireDiscoveryDateTime)).toString();

        // Add each point to the database as a fire object
        await Fire.create({
          fireName: newName,
          latitude: firePoint.geometry.coordinates[1],
          longitude: firePoint.geometry.coordinates[0],
          fireSize: firePoint.properties.DailyAcres,
          fireBehavior: totalBehavior,
          fireCause: firePoint.properties.FireCause,
          discoveryDate: newDate,
          percentContained: firePoint.properties.PercentContained,
          userName: 'system-auto'
        })
    }catch (err) {
        console.log(err);
    };
}

async function fetchPointData() {
    // Fire Point Data from NIFC
    // Visit https://data-nifc.opendata.arcgis.com/datasets/nifc::wfigs-current-wildland-fire-locations/about
    const firePointUrl = 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Current_WildlandFire_Locations/FeatureServer/0/query?where=1%3D1&outFields=DailyAcres,IncidentName,PercentContained,FireBehaviorGeneral,FireCause,FireDiscoveryDateTime,FireBehaviorGeneral3,FireBehaviorGeneral2,FireBehaviorGeneral1&outSR=4326&f=geojson'

    try {
        const fireData = await (await fetch(firePointUrl)).json();

        let fireCount = 0;    
        for (point of fireData.features) {
            // console.log(`Adding ${point.attributes.IncidentName}`)
            await addFire(point);
            fireCount++;
        };
        
        console.log(`Added ${fireCount} Fire Points`)
    } catch (err) {
        console.log(err);
    };
};

async function getGeoData() {
    try {
        await deletePoints('system-auto');
        await fetchPerimeterData();
        await fetchPointData();
    }catch (err) {
        console.log(err);
    }
}

async function refreshGeoJson(req, res) {
   try {
    console.log('Refreshing GeoJson...');
    const result = await getGeoData();
    res.send(result);
   }catch (err) {
    console.log(err);
   }
}

module.exports = {
    refreshGeoJson,
};
