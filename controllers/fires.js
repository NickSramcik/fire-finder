// const cloudinary = require("../middleware/cloudinary");
const Fire = require("../models/Fire");
const GeoJson = require("../models/GeoJson");
let newFires = [];

module.exports = {
  // Fire post creation and retrieval
  createFire: async (req, res) => {
    try {
      await Fire.create({
        fireName: req.body.fireName,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        // user: req.user.id,
        // userName: req.user.userName,
      });
      console.log("Fire has been added!");
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  },
  addGeoJson: async (req, res) => {
    try {
      let geojson = JSON.parse(req.body.geoJsonData);
      // Check if data includes polygons
      if (geojson['features'].filter(e => e['geometry']['type'] == 'Polygon').length > 0) {
        // Filter out point data, only keep polygon data
        console.log('Found polygons. Filtering out point data.');
        geojson['features'] = geojson['features'].filter(e => e['geometry']['type'] == 'Polygon');
      };

      // Check if data is fire points
      if (req.body.dataName.toLowerCase().includes('points')) {
        console.log('Handling mass fire point data');
        // Loop through each geojson feature and add each one to database as a fire point
        geojson.features.forEach(datapoint => {
          // ~~Data Cleanup~~
          // Combine all the fire behavior values into one value
          let totalBehavior = 
            `${datapoint.properties.FireBehaviorGeneral},${datapoint.properties.FireBehaviorGeneral1},${datapoint.properties.FireBehaviorGeneral2},${datapoint.properties.FireBehaviorGeneral3}`;
          // Clean up fire behavior data, remove nulls & duplicates
          totalBehavior = totalBehavior.split(',').filter((e, i, a) => e != 'null' && i == a.indexOf(e)).join(', ');
          // If no fire behavior data is present, give it value 'unknown'
          if (!totalBehavior) totalBehavior = 'Unknown';
          // Take the complex name if it exists, otherwise use incident name
          let newName = datapoint.properties.CpxName || datapoint.properties.IncidentName;
          // Standardize capitalization and trim empty spaces
          newName = newName.trim().toLowerCase().split(' ').filter(e => e)
                    .map(e => e[0].toUpperCase() + e.slice(1)).join(' ');
          // Add fire to end of name if it's not already there
          if (!newName.includes('Fire') && !newName.includes('Complex')) newName += ' Fire';

          // Add each point to the database as a fire object
          Fire.create({
            fireName: newName,
            latitude: datapoint.geometry.coordinates[1],
            longitude: datapoint.geometry.coordinates[0],
            fireSize: datapoint.properties.DailyAcres,
            fireBehavior: totalBehavior,
            fireCause: datapoint.properties.FireCause,
            discoveryDate: datapoint.properties.FireDiscoveryDateTime,
            percentContained: datapoint.properties.PercentContained,
          })
        })

      }else await GeoJson.create({
        // ^ If data is not full of points, add it to database as polygons
        dataName: req.body.dataName,
        geoJsonData: geojson,
        // user: req.user.id,
        // userName: req.user.userName,
      });
      console.log("GeoJson data has been added!");
      res.redirect("/fire/feed");
    } catch (err) {
      console.log(err);
    }
  },
  getFires: async (req, res) => {
    try {
      let fires = await Fire.find().sort({ fireSize: "desc" }).lean();
      // console.log(fires);
      res.json(fires);
    } catch (err) {
      console.log(err);
    }
  },
  getGeoJson: async (req, res) => {
    try {
      let geojson = await GeoJson.find().sort({ createdAt: "desc" }).lean();
      console.log(geojson);
      res.json(geojson);
    } catch (err) {
      console.log(err);
    }
  },
  // Fire Feed
  getFeed: async (req, res) => {
    console.log('Getting feed')
    try {
      const fires = await Fire.find().sort({ fireSize: "desc" }).lean();
      // console.log('Fire data:', fires)
      res.render("feed.ejs", { fires: fires });
    } catch (err) {
      console.log(err);
    }
  },
  getAdmin: async (req, res) => {
    console.log('Getting admin')
    try {
      res.render("admin.ejs");
    } catch (err) {
      console.log(err);
    }
  },
  getFirePage: async (req, res) => {
    try {
      const fire = await Fire.findById(req.params.id);
      // const comments = await Comment.find({ parentPost: req.params.id }).sort({ createdAt: "desc" }).lean();
      res.render("fire.ejs", { fire: fire, });
    } catch (err) {
      console.log(err);
    }
  },
};
