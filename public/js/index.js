document.getElementById('getFires').addEventListener('click', getFires);

function initMap() {
    // Map Options
    var options = {
      zoom: 8,
      center: {lat: 37.7749, lng: -122.4194}
    };

    // New Map
    var map = new google.maps.Map(document.getElementById('map'), options);

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

      // Add Marker on click
      google.maps.event.addListener(map, 'click', function(event){
        // Add marker
        addMarker({coords: event.latLng});
      })
    
    }

    addMarker({
      coords: {lat: 37.7749, lng: -122.4194},
      content: '<h1>San Francisco</h1>'
    });
  } 

  async function getFires() {
    console.log('Getting Fires')
    try {
        const response = await fetch('/fire/getFires', {
            method: 'get',
            headers: {'Content-Type': 'application/json'},
        })
        const data = await response.json()
        console.log(data)
    } catch(err) {
        console.log(err)
    }
}
