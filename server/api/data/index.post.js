import Data from '../../models/Data.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, location } = body

    console.log('Received Data:', body)

    const newPoint = new Data({ name, location })
    const savedPoint = await newPoint.save()
    
    console.log(`Added point ${newPoint.name}`)
    return { status: 201, data: savedPoint }

  } catch (error) {
    sendError(event, createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: error.message
    }))
  }
})
