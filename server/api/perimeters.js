import { defineEventHandler, readBody, getQuery } from 'h3';
import {
    getPerimeters,
    addPerimeter,
    updatePerimeter,
    deletePerimeter,
    renewPerimeters,
} from '../utils/perimeterHandler';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET /api/perimeters
        if (event.method === 'GET') {
            const perimeters = await getPerimeters(queryParams);
            return { statusCode: 200, data: perimeters };
        }

        // POST /api/perimeters
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await renewPerimeters();
                return { statusCode: 200, data: result };
            }

            const newPerimeter = await addPerimeter(body);
            return { statusCode: 201, data: newPerimeter };
        }

        // PUT /api/perimeters
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedPerimeter = await updatePerimeter(body.sourceId, body);
            return { statusCode: 200, data: updatedPerimeter };
        }

        // DELETE /api/perimeters
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage:
                        'At least one filter parameter is required for deletion',
                });
            }

            const result = await deletePerimeter(queryParams);
            return {
                statusCode: 200,
                data: { deletedCount: result.deletedCount },
            };
        }

        return createError({
            statusCode: 405,
            statusMessage: 'Method Not Allowed',
        });
    } catch (error) {
        console.error('Error in perimeters API:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            data: error.message,
        });
    }
});
