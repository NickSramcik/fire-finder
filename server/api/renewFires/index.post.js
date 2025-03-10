import { renewFires } from '../../utils/firePoints';

export default defineEventHandler(async (event) => {
  try {
    const result = await renewFires();
    return {
      statusCode: 200,
      data: result
    }
  } catch (error) {
    console.error("API error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: error.message
    });
  }
});
