import { defineEventHandler, readBody, getQuery } from 'h3';
import { fireService } from '../services/FireService.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        if (event.method === 'GET') {
            const fires = await fireService.find(queryParams);
            return { statusCode: 200, data: fires };
        }

        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await fireService.renewFires();
                return { statusCode: 200, data: result };
            }

            const newFire = await fireService.create(body);
            return { statusCode: 201, data: newFire };
        }

        if (event.method === 'PUT') {
            const body = await readBody(event);
            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }
            const updatedFire = await fireService.update(body.sourceId, body);
            return { statusCode: 200, data: updatedFire };
        }

        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'Filter parameter required',
                });
            }
            const result = await fireService.delete(queryParams);
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
        });
    }
});
