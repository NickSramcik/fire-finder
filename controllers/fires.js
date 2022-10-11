const cloudinary = require("../middleware/cloudinary");
const Fire = require("../models/Fire");
const GeoJson = require("../models/GeoJson");


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

      await GeoJson.create({
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
      let fires = await Fire.find().sort({ createdAt: "desc" }).lean();
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
      const fires = await Fire.find().sort({ createdAt: "desc" }).lean();
      // console.log('Fire data:', fires)
      res.render("feed.ejs", { fires: fires });
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
