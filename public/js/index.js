async function getGeoJson() {
    console.log('Getting GeoJson Data');
    try {
        const response = await fetch('/fire/getGeoJson', {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
        });
        console.log(response)
        const data = await response.json();
        // console.log('Data:', data);
        return data;
    } catch (err) {
        console.log(err);
    }
}

async function getFires() {
    console.log('Getting Fires');
    try {
        const response = await fetch('/fire/getFires', {
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data;
    } catch (err) {
        console.log(err);
    }
}

function initMap() {
    const successCallback = position => {
        console.log(position.coords.latitude, position.coords.longitude);
        
    };

    const errorCallback = error => {
        console.log(error);
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);

    // Map Options
    var options = {
        zoom: 5,
        center: { lat: 37.7749, lng: -122.4194 },
    };
    // Add Current Location
    let locationIcon = {
      path: 'M12 0c-5.522 0-10 4.395-10 9.815 0 5.505 4.375 9.268 10 14.185 5.625-4.917 10-8.68 10-14.185 0-5.42-4.478-9.815-10-9.815zm1 17.932v-3.932h-2v3.932c-3.618-.453-6.479-3.315-6.931-6.932h3.931v-2h-3.931c.452-3.617 3.314-6.479 6.931-6.931v3.931h2v-3.931c3.617.452 6.479 3.314 6.931 6.931h-3.931v2h3.931c-.452 3.617-3.314 6.479-6.931 6.932z',
      fillColor: 'deepskyblue',
      fillOpacity: 0.8,
      strokeWeight: 1,
      strokeColor: 'dodgerblue',
      rotation: 0,
      scale: 0.8,
  };
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          // Display location on the map
          addMarker({
            coords: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            },
            iconImage: locationIcon,
          });
          // Center the map on current location
          map.setCenter(pos);
        }
      );
    }

    function renderGeoJson(geojson) {
        // console.log('geojson data: ', geojson)
        // Style geojson data
        map.data.setStyle({
            // icon: '//example.com/path/to/image.png',
            fillColor: 'red',
            strokeColor: 'red',
        });
        // Render GeoJson data onto a Google Maps datalayer
        geojson.forEach(dataset => map.data.addGeoJson(dataset.geoJsonData));
    }

    // New Map
    var map = new google.maps.Map(document.getElementById('map'), options);

    // Get GeoJson data from server
    let geojson = getGeoJson();
    // When promise is fulfiled, (geojson retrieved) render it into the map
    geojson.then(geojson => renderGeoJson(geojson));

    // Add Marker Function
    function addMarker(props) {
        var marker = new google.maps.Marker({
            position: props.coords,
            map: map,
        });

        // Check for custom icon
        if (props.iconImage) {
            // Set icon image
            marker.setIcon(props.iconImage);
        }

        // Add link to fire's page
        marker.addListener('click', function () {
            location.replace(props.link);
        });

        // Check for content
        if (props.content) {
            var infoWindow = new google.maps.InfoWindow({
                content: props.content,
            });
            // Open info window on click
            // marker.addListener('click', function() {
            //   infoWindow.open(map, marker);
            // });
            // Open/close info window on mouseover/mouseoff
            marker.addListener('mouseover', function () {
                infoWindow.open(map, marker);
            });
            marker.addListener('mouseout', function () {
                infoWindow.close();
            });
        }

        // // Add Marker on click
        // google.maps.event.addListener(map, 'click', function(event){
        //   // Add marker
        //   addMarker({coords: event.latLng});
        // })
    }
    // Get fire locations from database
    let firePromise = getFires();
    // Process fire location data once recieved
    firePromise.then(fireLocations => {
        // Take the object containing each fire locations. For each entry, run a function.
        fireLocations.forEach(fire => {
            // Set Icon Style
            let fireIcon = {
                path: 'm2.095 19.882 9.248-16.5c.133-.237.384-.384.657-.384.272 0 .524.147.656.384l9.248 16.5c.064.115.096.241.096.367 0 .385-.309.749-.752.749h-18.496c-.44 0-.752-.36-.752-.749 0-.126.031-.252.095-.367z',
                fillColor: 'orange',
                fillOpacity: 0.8,
                strokeWeight: 1,
                strokeColor: 'darkorange',
                rotation: 0,
                scale: 0.8,
            };

            // Color code symbols according to containment %
            // Black for fully contained fires
            if (fire.percentContained >= 100) {
                fireIcon.fillColor = '#1c1c1c';
                fireIcon.strokeColor = 'black';
            }
            // Green for fires between 90% and 100% containment
            if (fire.percentContained < 100 && fire.percentContained >= 90) {
                fireIcon.fillColor = 'forestgreen';
                fireIcon.strokeColor = 'darkgreen';
            }
            // Yellow for fires between 50% and 90% containment
            if (fire.percentContained < 90 && fire.percentContained >= 50) {
                fireIcon.fillColor = 'gold';
                fireIcon.strokeColor = 'goldenrod';
            }
            // Orange for fires between 10% & 50% containment
            if (fire.percentContained < 50 && fire.percentContained >= 10) {
                fireIcon.fillColor = 'orange';
                fireIcon.strokeColor = 'darkorange';
            }
            // Red for fires with less than 10% containment
            if (fire.percentContained < 10) {
                fireIcon.fillColor = 'firebrick';
                fireIcon.strokeColor = 'darkred';
            }
            // Orange for fires with unknown containment
            if (fire.percentContained == null) {
                fireIcon.fillColor = 'orange';
                fireIcon.strokeColor = 'darkorange';
            }
            // Purple for prescribed burns
            if (fire.fireCause == 'Prescribed') {
                fireIcon.fillColor = 'mediumpurple';
                fireIcon.strokeColor = 'mediumorchid';
            }

            // Adjust icon scale to reflect fire size (in acres)
            if (fire.fireSize < 1000) {
                fireIcon.scale = 0.7;
            }
            if (fire.fireSize < 500) {
                fireIcon.scale = 0.6;
            }
            if (fire.fireSize < 100) {
                fireIcon.scale = 0.5;
            }
            if (fire.fireSize < 10) {
                fireIcon.scale = 0.4;
            }

            // Add a marker using the data from each fire location data entry
            addMarker({
                coords: {
                    lat: Number(fire.latitude),
                    lng: Number(fire.longitude),
                },
                content: `<h1>${fire.fireName}</h2>`,
                iconImage: fireIcon,
                link: `/fire/details/${fire._id}`,
            });
        });
    });

    // addMarker({
    //   coords: {lat: 37.7749, lng: -122.4194},
    //   content: '<h1>San Francisco</h1>'
    // });
}
