const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const firesController = require("../controllers/fires");
const nasaController = require("../controllers/nasa");
const geodataController = require("../controllers/geodata");

// const { ensureAuth, ensureGuest } = require("../middleware/auth");

// Fire Routes - simplified for now
router.get("/getFires", firesController.getFires);
router.get("/getGeoJson", firesController.getGeoJson);
router.post("/createFire", upload.single("file"), firesController.createFire);
router.get("/details/:id", firesController.getFirePage);

// NASA IR data routes
router.post("/refreshNasaIR", nasaController.refreshNasaIR);

// Geojson data routes
router.post("/refreshGeoJson", geodataController.refreshGeoJson);

// Feed Routes
// router.get("/feed", ensureAuth, firesController.getFeed);
router.get("/feed", firesController.getFeed);
router.get("/admin", firesController.getAdmin);
router.post("/addGeoJson", upload.single("file"), firesController.addGeoJson);


// router.delete("/deletePost/:id", firesController.deleteFire);

module.exports = router;
