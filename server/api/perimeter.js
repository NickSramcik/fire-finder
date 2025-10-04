import { defineEventHandler, readBody, getQuery } from 'h3';
import { perimeterService } from '../services/PerimeterService.js';

export default defineEventHandler(async event => {
    try {
        const queryParams = getQuery(event);

        if (event.method === 'GET') {
            const perimeters = await perimeterService.find(queryParams);
            return { statusCode: 200, data: perimeters };
        }

        if (event.method === 'POST') {
            const body = await readBody(event);

            if (body.action === 'renew') {
                const result = await perimeterService.renewPerimeters();
                return { statusCode: 200, data: result };
            }

            const newPerimeter = await perimeterService.create(body);
            return { statusCode: 201, data: newPerimeter };
        }

        if (event.method === 'PUT') {
            const body = await readBody(event);

            if (!body.sourceId) {
                return createError({
                    statusCode: 400,
                    statusMessage: 'sourceId is required',
                });
            }

            const updatedPerimeter = await perimeterService.update(
                body.sourceId,
                body
            );
            return { statusCode: 200, data: updatedPerimeter };
        }

        if (event.method === 'DELETE') {
            if (Object.keys(queryParams).length === 0) {
                return createError({
                    statusCode: 400,
                    statusMessage:
                        'At least one filter parameter is required for deletion',
                });
            }

            const result = await perimeterService.delete(queryParams);
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
