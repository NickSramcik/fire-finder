import Data from '../../models/Data.js'

export default defineEventHandler(async (event) => {
  try {
    const data = await Data.find({})
    return { status: 200, data }
  } catch (error) {
    sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      data: error.message
    }))
  }
})
