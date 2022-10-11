const mongoose = require("mongoose");

const FireSchema = new mongoose.Schema({
  fireName: {
    type: String,
    required: true,
  },
  latitude: {
    type: String,
    require: true,
  },
  longitude: {
    type: String,
    require: true,
  },
  fireSize: {
    type: Number,
    require: false,
  },
  fireBehavior: {
    type: String,
    require: false,
  },
  fireCause: {
    type: String,
    require: false,
  },
  discoveryDate: {
    type: String,
    require: false,
  },
  percentContained: {
    type: String,
    require: false,
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

module.exports = mongoose.model("Fire", FireSchema);
