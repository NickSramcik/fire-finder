import Fire from '../models/Fire.js';

export async function addFire(req, res) {
    try {
        const { fireId, sourceId, name, discoveredAt, lastUpdated, status, area, containment, cause, source, geometry } = req.body;
        //TODO: Resctructure this data to group fire properties together, and separate fire info from metadata
        if (!fireId || !name || !geometry) {
            return res.status(400).send("Missing required fields");
        }

        const fireData = { fireId, sourceId, name, discoveredAt, lastUpdated, status, area, containment, cause, source, geometry }
        
        await create(fireData);
        console.log(`Fire: '${name}' has been added!`);
    } catch (err) {
        console.log(err);
        if (res) res.status(500).send("Error adding fire");
    }
}

// Renew Fire Data

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




// ---Fire History---

// Create History

// Post request that adds new entry to Fire History collection


// Add Snapshot

// Search Fire History collection for this fire
// If found:
//      Update request this fire
//      Collect data into snapshot object, add to this fire's array of snapshots
//      Log this snapshot 
// If not found:
//      Create new Fire History entry with matching fireId
//      Log this new Fire History creation