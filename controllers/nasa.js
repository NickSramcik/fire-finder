const KMZGeoJSON = require('kmz-geojson');
const GeoJson = require("../models/GeoJson");
const KMZUrl = 'https://firms.modaps.eosdis.nasa.gov/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz';

async function deleteGeoJson(geoJsonName) {
    try {
        // Delete geojson from database
        await GeoJson.remove({ dataName: geoJsonName });
        console.log("Deleted GeoJson");
    } catch (err) {
        console.log(err);
    };
};

async function uploadGeoJson(geojson) {
    try {
        // Check if data includes polygons
        if (geojson['features'].filter(e => e['geometry']['type'] == 'Polygon').length > 0) {
          // Filter out point data, only keep polygon data
          console.log('Found polygons. Filtering out point data.');
          geojson['features'] = geojson['features'].filter(e => e['geometry']['type'] == 'Polygon');
        };
        // Delete old NASA IR data
        await deleteGeoJson('NASA IR');
        // Upload new NASA IR data to database
        await GeoJson.create({
          dataName: 'NASA IR',
          geoJsonData: geojson,
          // user: req.user.id,
          // userName: req.user.userName,
        });
      console.log("GeoJson data has been added!");
    } catch (err) {
        console.log(err);
    };
};

function refreshNasaIR() {
    console.log('Downloading Nasa IR');
    // Download and convert NASA IR .kmz to .geojson
    KMZGeoJSON.toGeoJSON(KMZUrl, function(err, json) {
        // Replace NASA IR data in database
        uploadGeoJson(json);
    });
}

module.exports = {
    deleteGeoJson,
    uploadGeoJson,
    refreshNasaIR
};