const cloudinary = require("../middleware/cloudinary");
const Fire = require("../models/Fire");

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
  getFires: async (req, res) => {
    try {
      let fires = await Fire.find().sort({ createdAt: "desc" }).lean();
      console.log(fires);
      res.json(fires);
    } catch (err) {
      console.log(err);
    }
  },
  // Fire Feed
  getFeed: async (req, res) => {
    console.log('Getting feed')
    try {
      const fires = await Fire.find().sort({ createdAt: "desc" }).lean();
      console.log('Fire data:', fires)
      res.render("feed.ejs", { fires: fires });
    } catch (err) {
      console.log(err);
    }
  },
};
