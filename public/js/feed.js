document.getElementById('getFires').addEventListener('click', getFires);

let promise = getFires();
  // Process fire location data once recieved
  promise.then(fireLocations => {
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


async function getFires() {
  console.log('Getting Fires')
  try {
    const response = await fetch('/fire/getFires', {
        method: 'get',
        headers: {'Content-Type': 'application/json'},
      })
    const data = await response.json()
      return data;
    }catch(err) {
      console.log(err);
  }
}
