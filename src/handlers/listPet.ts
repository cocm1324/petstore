import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';
import { HttpResultV2 } from '../libs';
import { petSerializer } from '../libs/serializer';

import { HttpStatusCode, IdPrefix, ListPetQuerySchema, TableName } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const listPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const { value: query, error: queryError } = ListPetQuerySchema.validate(event.queryStringParameters, { abortEarly: false });
    if (queryError) {
        const arrayOfMessage: string[] = queryError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const isStatusQuery = query && query.status;

    const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: TableName.Pet,
        ExpressionAttributeNames: isStatusQuery ? 
            { '#pk': 'id', '#s': 'status' }:
            { '#pk': 'id' },
        ExpressionAttributeValues: isStatusQuery ? 
            { ':pk': IdPrefix.Pet, ':s': query.status }:
            { ':pk': IdPrefix.Pet },
        FilterExpression: `begins_with(#pk, :pk)${isStatusQuery ? ' AND #s = :s' : ''}`
    };

    try {
        const result = await dynamoDb.scan(params).promise();

        if (!result.Items) {
            return HttpResultV2(HttpStatusCode.OK, []);
        }

        const serialized = petSerializer(result.Items);
        return HttpResultV2(HttpStatusCode.OK, serialized);

    } catch (error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
