import Fire from '../models/Fire';

// Renew Fire Data

export const fetchFirePoints = async () => {
    // Fire Point Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=4181a117dc9e43db8598533e29972015
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

    try {
        const fireData = await (await fetch(firePointUrl)).json();
        console.log(fireData);
        let fireCount = 0;
        for (point of fireData.features) {
            // console.log(`Adding ${point.attributes.IncidentName}`)
            await addFire(point);
            fireCount++;
        }

        console.log(`Added ${fireCount} Fire Points`);
    } catch (err) {
        console.log(err);
    }
}

export const renewFires = async () => {
    // Fire Point Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=4181a117dc9e43db8598533e29972015
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

    try {
        const fireData = await (await fetch(firePointUrl)).json();
        let added = 0, updated = 0;

        for (const rawFire of fireData.features) {
            const processedFire = processFire(rawFire);
            const existing = await Fire.findOne({ name: processedFire.name });

            if (existing) {
                updateFire(existing._id, processedFire);
                updated++;
            } else {
                addFire(processedFire);
                added++;
            }
        }

        return { added, updated };
    } catch (err) {
        console.log(err);
    }
    
  
    for (const rawFire of externalData) {
      const processed = processFire(rawFire);
      const existing = await Fire.findOne({ name: processed.name });
      
      existing ? await updateFire(existing._id, processed) && updated++
              : await addFire(processed) && added++;
    }
  
    return { added, updated, total: await Fire.countDocuments() };
  };

// Log that fires are renewing at this time
// Selectively request fire data from NIFC API
// Loop through each fire point ---------------------- Time complexity really matters here! 
//      Search database for this fire
//      If it exists:
//          Update this fire
//      If it doesn't exist:
//          Process this fire data
//          Add this fire
// Check database for dead fires that haven't updated in several months, delete any that are found


// Update Fire Data

// Get old data for this fire
// Check status, area, containent, cause, source, and geometry for changes
// If anything changed:
//      Add old data snapshot to Fire History
//      Store which fields updated for future metadata tracking
//      Update request database to make all updated changes
// Log the success of this fire update


// Delete Fire Data

// Update this fire to set "deleted" property to true
// TODO: Should fires be hard deleted or soft deleted with a property? 