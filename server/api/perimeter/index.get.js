import { connectDB } from '../../utils/db';
import Perimeter from '../../models/Perimeter.js'

export default defineEventHandler(async (event) => {
  try {
    await connectDB();
    const data = await Perimeter.find().lean();

    return { status: 200, data }
  } catch (error) {
    console.error('Error fetching perimeters:', error);
    sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Server Error',
      data: error.message
    }))
  }
})
