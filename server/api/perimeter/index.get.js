import Perimeter from '../../models/Perimeter.js'

export default defineEventHandler(async (event) => {
  try {
    const data = await Perimeter.find().lean();

    return { status: 200, data }
  } catch (error) {
    sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      data: error.message
    }))
  }
})
