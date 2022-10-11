const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const connectDB = require("./config/database");
const cron = require('node-cron');
const KMZGeoJSON = require('kmz-geojson');
const mainRoutes = require("./routes/main");
const fireRoutes = require("./routes/fires");
const GeoJson = require("./models/GeoJson");
const KMZUrl = 'https://firms.modaps.eosdis.nasa.gov/api/kml_fire_footprints/usa_contiguous_and_hawaii/24h/suomi-npp-viirs-c2/FirespotArea_usa_contiguous_and_hawaii_suomi-npp-viirs-c2_24h.kmz';


//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

//Connect To Database
connectDB();

//Using EJS for views
app.set("view engine", "ejs");

//Static Folder
app.use(express.static("public"));

//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Logging
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/fire", fireRoutes);

//Tailwind
app.use(express.static('node_modules/tw-elements/dist/js'));


//Server Running
app.listen(process.env.PORT, () => {
  console.log("Server is running, you better catch it!");
});

// NASA IR Data Scrnpmaper
async function deleteGeoJson(geoJsonName) {
  try {
    // Delete post from db
    await GeoJson.remove({ dataName: geoJsonName });
    console.log("Deleted GeoJson");
  } catch (err) {
  }
}

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

// Refresh NASA IR data every 6 hours
cron.schedule('0 */6 * * *', () => {
  refreshNasaIR();
});
