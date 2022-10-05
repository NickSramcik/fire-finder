# Fire Finder

This project's purpose is to make wildfire information more accessible for the average, non-tech-savy person. There are many places to get this information, but they are difficult to find, use, and/or navigate even for experts in the field. Fire Finder is designed to be simple and easy to use for everyone. 

**Link to project:** https://fire-finder.herokuapp.com/ 

![Website preview](https://i.imgur.com/qXfJbQE.jpg)

## How It's Made:

**Tech used:** HTML, EJS, CSS, Tailwind, DaisyUI, JavaScript, Node.js, MongoDB, Google Maps API

Fire Finder is built using Google Map's Javascript API. I chose Google Maps because most people have familiarty with it and have a general idea of how to use it. 

EJS, an HTML templating language, allows for dynamic rendering of the HTML document. This will be important for future functionality. 

CSS is generated using Tailwind and DaisyUI, which helps keep both the HTML and CSS more organized and optimized. 

User data is submitted to the server and stored using MongoDB. In the future, this database will also be used to store user authentication and session information.

## Optimizations

There are many things left to do for this project given more time and resources. First, the fire information needs to have more detail. Fire Finder currently only takes in the name of the incident, and its location. The first step will be to center the map on the user's location, and to add support for GIS shape files, so that users can see exactly where the fires are burning. (Instead of a single point location.)

The next step will be to add data scraping functionality, so that fire information doesn't have to be manually submitted to the server. This will also make it practical to add much more information, such as how many acres the fire has already burned, the containment percentage of the fire, the date and cause of the fire starting, etc. 

Once that is completed, user authentication will be the next step. This will neccesary to allow users to sign in, set a home location, setup alerts if a fire is near them, and comment on individual incididents so that locals can share information that can't be found via data scraping. 

The final step will be to add local fire news snippets that are relevant to the user's location. This will again be obtained via data scraping. Once this feature is implemented, the project will be considered finished, with further optimizations being made to help the site run better on low-end devices with slow internet connections. (Which are very common in the rural communities that are affected by wildfires.) 

Additionally, a transition from EJS HTML templating to React.js is needed to help the website be more flexible to dynamic changes. This will happen in parallel with the previously mentioned steps. 

## Lessons Learned:

This project has forced me to fill many gaps in my knowledge of full-stack web development. I've had to get comfortable using ayschronous javascript so that I could marry together the functionality of different APIs and database structures that Fire Finder relies on to work. I've also needed to stretch my knowledge of backend CRUD requests, as the functionality needed for this website is very different from what I've done before. Specifically, the data stored and accessed from the database needs to be processed with separate web APIs instead of directly rendered into an EJS file. 

This is the first project I've implemented a CSS framework (Tailwind) into. I've learned just how powerful they can be, and I've only just scratched the surface. CSS frameworks can be really tricky to work with, but once the initial learning curve is surpassed, it makes styling the website much easier in the long run. 
