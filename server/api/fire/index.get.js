import FirePoint from '../../models/FirePoint.js'

export default defineEventHandler(async (event) => {
  try {
    const data = await FirePoint.find({
        'properties.area': { 
          $exists: true, 
          $ne: null 
        }
      }).lean();

    return { status: 200, data }
  } catch (error) {
    sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      data: error.message
    }))
  }
})
