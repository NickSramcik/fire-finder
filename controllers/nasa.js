const KMZGeoJSON = require('kmz-geojson');
const GeoJson = require("../models/GeoJson");

async function deleteNasaGeoJson(geoJsonName) {
    try {
        // Delete geojson from database
        await GeoJson.deleteMany({ dataName: geoJsonName });
        console.log("Deleted NASA Infrared Data");
    } catch (err) {
        console.log(err);
    };
};

async function uploadNasaGeoJson(geojson) {
    try {
        console.log('Processing data...')
        // Check if data includes polygons
        if (geojson['features'].filter(e => e['geometry']['type'] == 'Polygon').length > 0) {
          // Filter out point data, only keep polygon data
          console.log('Found polygons. Filtering out point data.');
          geojson['features'] = geojson['features'].filter(e => e['geometry']['type'] == 'Polygon');
        };
        // Delete old NASA IR data
        await deleteNasaGeoJson('NASA IR');
        // Upload new NASA IR data to database
        await GeoJson.create({
          dataName: 'NASA IR',
          geoJsonData: geojson,
          // user: req.user.id,
          // userName: req.user.userName,
        });
        console.log("NASA Infrared data has been added!");
    } catch (err) {
        console.log(err);
    };
};

async function fetchNasaGeoJson() {
    const KMZUrl = 'https://firms.modaps.eosdis.nasa.gov/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz';

    try {
        console.log('Downloading Nasa IR');
        // Download and convert NASA IR .kmz to .geojson
        const nasajson = await new Promise((resolve, reject) => {
            KMZGeoJSON.toGeoJSON(KMZUrl, function(err, json) {
                console.log('NASA KMZ converted to GeoJSON')
                if (err) reject(err)
                resolve(json)
            });
        });
        // Replace NASA IR data in database
        await uploadNasaGeoJson(nasajson);
    } catch (err) {
        console.log(err);
    };
}

async function refreshNasaIR(req, res) {
    try {
        const result = await fetchNasaGeoJson();
        res.send(result);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    deleteNasaGeoJson,
    uploadNasaGeoJson,
    fetchNasaGeoJson,
    refreshNasaIR,
};