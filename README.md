# Fire Finder

This project's purpose is to make wildfire information more accessible for the average, non-tech-savy person. There are many places to get this information, but they are difficult to find, use, and/or navigate even for experts in the field. Fire Finder is designed to be simple and easy to use for everyone.

**Link to project:** https://www.firefinder.io

![Website preview](https://i.imgur.com/l0Jh3YR.jpg)

## How It's Made:

**Tech used:** HTML, EJS, CSS, Tailwind, DaisyUI, JavaScript, Node.js, MongoDB, Google Maps API

Fire Finder is built using Google Map's Javascript API. I chose Google Maps because most people have familiarty with it and have a general idea of how to use it.

EJS, an HTML templating language, allows for dynamic rendering of the HTML document. This will be important for future functionality.

CSS is generated using Tailwind and DaisyUI, which helps keep both the HTML and CSS more organized and optimized.

Fire data is sourced from NASA's infrared API, and the NIFC API. Data is fetched every 6 hours using a cron scheduler, processed by the server, and stored using MongoDB. User login and session data is also stored here.

## Optimizations

There are many things left to do for this project given more time and resources. Fire information can be more extensive, taking advantage of extra metadata that NIFC includes in its database. User logins will be used in the future to save a home location, where the map will center by default in the future.

User logins will also be useful to add comments on each fire, to further supply users with the tools they need to communicate with local community experts. Logins are already implemented, but they currently don't have many associated features implemented.

Additionally, a transition from EJS HTML templating to React.js is needed to help the website be more flexible to dynamic changes. This will happen in parallel with the previously mentioned steps.

## Lessons Learned:

This project has forced me to fill many gaps in my knowledge of full-stack web development. I've had to get comfortable using ayschronous javascript so that I could marry together the functionality of different APIs and database structures that Fire Finder relies on to work. I've also needed to stretch my knowledge of backend CRUD requests, as the functionality needed for this website is very different from what I've done before. Specifically, the data stored and accessed from the database needs to be processed with separate web APIs instead of directly rendered into an EJS file.

Implementing Tailwind into Fire Finder has been a great learning experience. I've learned how powerful CSS frameworks can be, and I've only just scratched the surface. CSS frameworks can be really tricky to work with, but once the initial learning curve is surpassed, it makes styling the website much easier in the long run.
