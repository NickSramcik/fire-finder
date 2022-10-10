async function getGeoJson() {
  console.log('Getting GeoJson Data')
  try {
      const response = await fetch('/fire/getGeoJson', {
          method: 'get',
          headers: {'Content-Type': 'application/json'},
      })
      const data = await response.json();
      console.log('Data:', data);
      return data;
  } catch(err) {
      console.log(err)
  }
}

async function getFires() {
  console.log('Getting Fires')
  try {
      const response = await fetch('/fire/getFires', {
          method: 'get',
          headers: {'Content-Type': 'application/json'},
      })
      const data = await response.json()
      return data;
  } catch(err) {
      console.log(err)
  }
}

function initMap() {
    // Map Options
    var options = {
      zoom: 5,
      center: {lat: 37.7749, lng: -122.4194}
    };

    function renderGeoJson(geojson) {
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

      // Check for content
      if (props.content) {
        var infoWindow = new google.maps.InfoWindow({
          content: props.content
        });

        marker.addListener('click', function() {
          infoWindow.open(map, marker);
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
      fireLocations.forEach(e => {
        // Add a marker using the data from each fire location data entry
        addMarker({
          coords: {lat: Number(e.latitude), lng: Number(e.longitude)},
          content: `<h1>${e.fireName}</h2>`
        });
      });
    });
 

    // addMarker({
    //   coords: {lat: 37.7749, lng: -122.4194},
    //   content: '<h1>San Francisco</h1>'
    // });
  } 