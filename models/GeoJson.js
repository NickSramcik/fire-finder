const mongoose = require("mongoose");

const GeoJsonSchema = new mongoose.Schema({
  dataName: {
    type: String,
    required: true,
  },
  geoJsonData: {
    type: Object,
    require: true,
  },
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  // },
  // userName: {
  //   type: String,
  //   required: true,
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GeoJson", GeoJsonSchema);
