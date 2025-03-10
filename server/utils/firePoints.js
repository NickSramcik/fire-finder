import FirePoint from '../models/FirePoint';

// Renew Fire Data

export const renewFires = async () => {
    try {
      const fireData = await fetchFirePoints();
      let added = 0, updated = 0;
  
      for (const rawFire of fireData) {
        const processedFire = processFire(rawFire);
        const id = processedFire.properties.sourceId;
        const fireExists = await FirePoint.findOne({ 'properties.sourceId': id});

        if (fireExists) {
            // console.log(`${processedFire.properties.name} already exists, attempting to update it...`);
            await updateFire(id, processedFire);
            updated++;
        } else {
            await addFire(processedFire);
            added++;
        }
      }
      
      console.log(`Added ${added} fires and Updated ${updated} fires`)
      return { added, updated };
    } catch (err) {
      console.error("Error renewing fires: ", err);
      throw err;
    }
};

export const addFire = async (firePoint) => {
    try {
        const newPoint = new FirePoint(firePoint);
        const savedPoint = await newPoint.save()
            
        console.log(`Added point ${newPoint.properties.name}`)
        return { status: 201, data: savedPoint }

    } catch (err) {
        console.error("Error adding fire: ", err);
        throw err;
    }
};

export const updateFire = async (id, newPoint) => {
    try {
        const query = { 'properties.sourceId': id };
        const update = newPoint;
        const options = { new: true, runValidators: true };
        // console.log(`Searching for ${newPoint.properties.name} with sourceId: ${id}`)
        const updatedPoint = await FirePoint.findOneAndUpdate(query, update, options);

        if (!updatedPoint) {
            throw new Error('Fire point not found');
        }

        // console.log(`Updated fire point: ${updatedPoint._id}`);
        return updatedPoint;
    } catch (err) {
        console.error("Error updating fire: ", err);
        throw err;
    }
} 

export const deleteFire = async (query) => {
    try {
        const deletedCount = await FirePoint.deleteMany(query);

        return { status: 201, data: deletedCount };
    } catch (err) {
        console.error("Error deleting fire: ", err);
        throw err;
    }
}

export const fetchFirePoints = async () => {
    // Fire Point Data from NIFC
    // Visit https://nifc.maps.arcgis.com/home/item.html?id=4181a117dc9e43db8598533e29972015
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentSize%2CSourceOID%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

    try {
        const firePoints = await (await fetch(firePointUrl)).json();
        let fireCount = firePoints.features.length;
        console.log(`Fetched ${fireCount} Fire Points`);
        return firePoints.features;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export const processFire = (rawPoint) => {
    let prescribed = false;
    const processedPoint = {
        geometry: { type: 'Point', coordinates: rawPoint.geometry.coordinates},
        properties: {
            sourceId: rawPoint.properties.SourceOID,
            name: fixName(),
            discoveredAt: new Date(rawPoint.properties.FireDiscoveryDateTime),
            lastUpdated: Date.now(),
            status: fixStatus(),
            area: rawPoint.properties.FinalAcres,
            containment: rawPoint.properties.PercentContained,
            cause: rawPoint.properties.FireCause,
            source: 'NIFC',
        }
    }

    return processedPoint;

    function fixName() {
        let newName = rawPoint.properties.IncidentName
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());
        
        // Add Fire to name if there is no good incident descriptor already exists
        if (!/(Fire|Rx|Pb|Prep|Piles|Tree Removal|Complex)\b/.test(newName)) {
            newName += ' Fire';
        }

        // Check for and clarify prescribed burn jargon
        if (/(Rx|Bp|Pb|Prep|Piles)\b/.test(newName)) {
            prescribed = true;

            newName = newName.replace(/Pb|Rx|Bp/g, match => {
                switch (match) {
                    case 'Pb':
                        return 'Prescribed Burn';
                    case 'Rx':
                        return 'Prescribed Burn';
                    case 'Bp':
                        return 'Burn Piles';
                }
            });
        }

        return newName;
    }

    function fixStatus() {
        const behaviors = [rawPoint.properties.FireBehaviorGeneral, 
                           rawPoint.properties.FireBehaviorGeneral1, 
                           rawPoint.properties.FireBehaviorGeneral2, 
                           rawPoint.properties.FireBehaviorGeneral3]
        
        let newStatus = [...new Set(behaviors)].filter(behavior => behavior !== null).join(', ');
        
        if (!newStatus) {
            if (prescribed) return 'Prescribed'
            return null;
        }

        return newStatus;
    }
}

// { type: 'Feature',
//     geometry: { type: 'Point', coordinates: [ -150.866437532387, 60.4878035289611 ] },
//     properties:
//      { FinalAcres: null,
//        IncidentName: 'CY25 Wharf Ave RX',
//        PercentContained: null,
//        IncidentSize: null,
//        FireBehaviorGeneral: null,
//        FireCause: 'Undetermined',
//        FireDiscoveryDateTime: 1735750800000,
//        FireBehaviorGeneral3: null,
//        FireBehaviorGeneral2: null,
//        FireBehaviorGeneral1: null } }

// for (const rawFire of externalData) {
//       const processed = processFire(rawFire);
//       const existing = await Fire.findOne({ name: processed.name });
      
//       existing ? await updateFire(existing._id, processed) && updated++
//               : await addFire(processed) && added++;
//     }
  
//     return { added, updated, total: await Fire.countDocuments() };

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