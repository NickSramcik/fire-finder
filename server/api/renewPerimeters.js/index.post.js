import { renewPerimeters } from '../../utils/perimeters';

export default defineEventHandler(async (event) => {
  try {
    const result = await renewPerimeters();
    return {
      statusCode: 200,
      data: result
    }
  } catch (error) {
    console.error("API error renewing perimeters:", error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: error.message
    });
  }
});
