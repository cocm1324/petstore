import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetIdParamSchema, HttpStatusCode } from '../models';
import { HttpResultV2, petSerializer } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const getPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    try {
        const params: DynamoDB.DocumentClient.ScanInput = {
            TableName: TableName.Pet,
            ExpressionAttributeNames: { '#pk': 'id' },
            ExpressionAttributeValues: { ':pk': pathParameter.petId },
            FilterExpression: '#pk = :pk'
        };

        const result = await dynamoDb.scan(params).promise();
        if (!result.Items) return HttpResultV2(HttpStatusCode.NotFound, { message: 'Item with provided petId is not found' });
        
        const serialized = petSerializer(result.Items)
        return HttpResultV2(HttpStatusCode.OK, serialized[0]);

    } catch (error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
