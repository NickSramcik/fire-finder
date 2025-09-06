import { connectDB } from '../../utils/db';
import FirePoint from '../../models/FirePoint';

export default defineEventHandler(async () => {
  try {
    await connectDB();
    const fires = await FirePoint.find({
      'properties.area': { 
        $exists: true, 
        $ne: null 
      }
    }).lean();
    return { data: fires };
  } catch (error) {
    console.error('Error fetching fires:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
