import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

export const healthCheck = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'hello world',
        }),
    };
};