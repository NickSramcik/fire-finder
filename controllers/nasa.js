const KMZGeoJSON = require('kmz-geojson');
const GeoJson = require("../models/GeoJson");
const KMZUrl = 'https://firms.modaps.eosdis.nasa.gov/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz';

async function deleteNasaGeoJson(geoJsonName) {
    try {
        // Delete geojson from database
        await GeoJson.remove({ dataName: geoJsonName });
        console.log("Deleted NASA Infrared Data");
    } catch (err) {
        console.log(err);
    };
};

async function uploadNasaGeoJson(geojson) {
    try {
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

async function refreshNasaIR(req, res) {
    try {
        console.log('Downloading Nasa IR');
        // Download and convert NASA IR .kmz to .geojson
        await KMZGeoJSON.toGeoJSON(KMZUrl, function(err, json) {
            // Replace NASA IR data in database
            uploadNasaGeoJson(json);
        });
        res.json(ret);
    }catch (err) {
        console.log(err);
    }
}

module.exports = {
    deleteNasaGeoJson,
    uploadNasaGeoJson,
    refreshNasaIR,
};