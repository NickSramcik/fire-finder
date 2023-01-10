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
const dataScraper = require('./data-scraper.js');
const mainRoutes = require("./routes/main");
const fireRoutes = require("./routes/fires");



//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

// //Connect To Database
// connectDB();

// Connect asyncronously for Cyclic's serverless architecture
const { MongoClient } = require('mongodb');
const uri = process.env.DB_STRING;
const client = new MongoClient(uri);
const dbS = connectDB().then(() => {
  client.connect(async err => {
    //Connect To Database
    if(err){ console.error(err); return false;}
    // connection to mongo is successful, listen for requests
    app.listen(3000, () => {
      console.log("Server is running, you better catch it!");
    })
  });
})

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


// // Server Running
// app.listen(process.env.PORT, () => {
//   console.log("Server is running, you better catch it!");
// });

// Refresh NASA IR data every 6 hours
// cron.schedule('0 */6 * * *', () => {
//   dataScraper.refreshNasaIR();
// });