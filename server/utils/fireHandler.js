import FirePoint from '../models/FirePoint';

const mapQuery = apiQuery => {
    const dbQuery = {};

    if (apiQuery.sourceId) {
        dbQuery['properties.sourceId'] = apiQuery.sourceId;
    }

    if (apiQuery.status) {
        dbQuery['properties.status'] = apiQuery.status;
    }

    if (apiQuery.cause) {
        dbQuery['properties.cause'] = apiQuery.cause;
    }

    return dbQuery;
};

export const getFires = async (apiQuery = {}) => {
    try {
        const dbQuery = mapQuery(apiQuery);
        const fires = await FirePoint.find(dbQuery);
        return fires;
    } catch (error) {
        console.error('Error getting fires:', error);
        throw error;
    }
};

// Add a new fire
export const addFire = async fireData => {
    try {
        const newFire = new FirePoint(fireData);
        const savedFire = await newFire.save();
        console.log(`Added fire: ${newFire.properties.name}`);
        return savedFire;
    } catch (error) {
        console.error(`Error adding fire: ${fireData.properties.name}`, error);
        throw error;
    }
};

// Update a fire by ID or query
export const updateFire = async (sourceId, updateData) => {
    try {
        const query = { 'properties.sourceId': sourceId };
        const options = { new: true, runValidators: true };
        const updatedPoint = await FirePoint.findOneAndUpdate(
            query,
            updateData,
            options
        );

        if (!updatedPoint) {
            throw new Error(
                `Fire point: ${updateData.properties.name} not found`
            );
        }

        console.log(`Updated fire: ${updatedPoint.properties.name}`);
        return updatedPoint;
    } catch (error) {
        console.error('Error updating fire:', error);
        throw error;
    }
};

// Delete fires
export const deleteFire = async (apiQuery = {}) => {
    try {
      const dbQuery = mapQuery(apiQuery)
      
      // Safety check - don't allow empty queries that would delete all documents
      if (Object.keys(dbQuery).length === 0) {
        throw new Error('Delete query must include at least one filter parameter')
      }
      
      const result = await FirePoint.deleteMany(dbQuery)
      console.log(`Deleted ${result.deletedCount} fire(s)`)
      return result
    } catch (error) {
      console.error('Error deleting fire(s):', error)
      throw error
    }
  }

// Renew fire data
export const renewFires = async () => {
    try {
        const fireData = await fetchFirePoints();
        let added = 0,
            updated = 0;

        for (const rawFire of fireData) {
            const processedFire = processFire(rawFire);
            const sourceId = processedFire.properties.sourceId;

            try {
                const existingFire = await getFires({ sourceId })

                if (existingFire) {
                    await updateFire(sourceId, processedFire);
                    updated++;
                } else {
                    await addFire(processedFire);
                    added++;
                }
            } catch (error) {
                console.error(`Error processing fire ${sourceId}:`, error);
            }
        }

        console.log(`Added ${added} fires and Updated ${updated} fires`);
        return { added, updated };
    } catch (error) {
        console.error('Error renewing fires:', error);
        throw error;
    }
};

// Fetch fire points from NIFC API
export const fetchFirePoints = async () => {
    const firePointUrl =
        'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&outFields=FinalAcres%2CIncidentSize%2CSourceOID%2CIncidentName%2CPercentContained%2CIncidentSize%2CFireBehaviorGeneral%2CFireCause%2CFireDiscoveryDateTime%2CFireBehaviorGeneral3%2CFireBehaviorGeneral2%2CFireBehaviorGeneral1&f=pgeojson&token=';

    try {
        const firePoints = await (await fetch(firePointUrl)).json();
        console.log(`Fetched ${firePoints.features.length} Fire Points`);
        return firePoints.features;
    } catch (err) {
        console.error('Error fetching fire points:', err);
        throw err;
    }
};

// Process raw fire data
export const processFire = rawPoint => {
    let prescribed = false;

    const processedPoint = {
        geometry: { type: 'Point', coordinates: rawPoint.geometry.coordinates },
        properties: {
            sourceId: rawPoint.properties.SourceOID,
            name: fixName(),
            discoveredAt: new Date(rawPoint.properties.FireDiscoveryDateTime),
            lastUpdated: Date.now(),
            status: fixStatus(),
            area: rawPoint.properties.IncidentSize,
            containment: rawPoint.properties.PercentContained,
            cause: rawPoint.properties.FireCause,
            source: 'NIFC',
        },
    };

    return processedPoint;

    function fixName() {
        let newName = rawPoint.properties.IncidentName.trim()
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

        // Add Fire to name if there is no good incident descriptor
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
                    default:
                        return match;
                }
            });
        }

        return newName;
    }

    function fixStatus() {
        const behaviors = [
            rawPoint.properties.FireBehaviorGeneral,
            rawPoint.properties.FireBehaviorGeneral1,
            rawPoint.properties.FireBehaviorGeneral2,
            rawPoint.properties.FireBehaviorGeneral3,
        ];

        let newStatus = [...new Set(behaviors)]
            .filter(behavior => behavior !== null)
            .join(', ');

        if (!newStatus) {
            if (prescribed) return 'Prescribed';
            return null;
        }

        return newStatus;
    }
};

// Clean up old fires that haven't been updated
export const cleanupOldFires = async (daysThreshold = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        const result = await FirePoint.deleteMany({
            'properties.lastUpdated': { $lt: cutoffDate },
        });

        console.log(`Cleaned up ${result.deletedCount} old fires`);
        return result;
    } catch (error) {
        console.error('Error cleaning up old fires:', error);
        throw error;
    }
};
