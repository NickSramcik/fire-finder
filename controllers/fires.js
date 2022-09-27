const cloudinary = require("../middleware/cloudinary");
const Fire = require("../models/fire");

module.exports = {
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
      const fires = await Fire.find().sort({ createdAt: "desc" }).lean();
      console.log(fires)
    } catch (err) {
      console.log(err);
    }
  },
};
