const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const firesController = require("../controllers/fires");
// const { ensureAuth, ensureGuest } = require("../middleware/auth");

//Post Routes - simplified for now
router.get("/getFires", firesController.getFires);

router.post("/createFire", upload.single("file"), firesController.createFire);

// router.delete("/deletePost/:id", firesController.deleteFire);

module.exports = router;
