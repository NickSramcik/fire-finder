import { connectDB } from '../../utils/db';
import FirePoint from '../../models/FirePoint.js'

export default defineEventHandler(async (event) => {
  try {
    await connectDB();
    const data = await FirePoint.find({
        'properties.area': { 
          $exists: true,  // Ensures the field exists
          $ne: null       // Ensures the value is not null
        }
      }).select('properties').lean();

    data.sort((a, b) => b.properties.area - a.properties.area); // Sort data by size of fire

    return { status: 200, data }
  } catch (error) {
    sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      data: error.message
    }))
  }
})
