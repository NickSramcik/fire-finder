import { defineEventHandler, readBody, getQuery } from 'h3';
import {
    getFires,
    addFire,
    updateFire,
    deleteFire,
    renewFires,
} from '../utils/fireHandler';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        // GET /api/fires
        if (event.method === 'GET') {
            const fires = await getFires(queryParams);
            return { statusCode: 200, data: fires };
        }

        // POST /api/fires
        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await renewFires();
                return { statusCode: 200, data: result };
            }

            const newFire = await addFire(body);
            return { statusCode: 201, data: newFire };
        }

        // PUT /api/fires
        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedFire = await updateFire(body.sourceId, body);
            return { statusCode: 200, data: updatedFire };
        }

        // DELETE /api/fires
        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'At least one filter parameter is required for deletion',
                });
            }

            const result = await deleteFire(queryParams);
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
        console.error('Error in fires API:', error);
        return createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            data: error.message,
        });
    }
});
