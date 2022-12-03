import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';
import { HttpResultV2 } from '../libs';

import { HttpStatusCode, ListPetQuerySchema, PetSortKeyMetadata, TableName } from '../models';

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
            { '#t': 'type', '#s': 'status' }:
            { '#t': 'type' },
        ExpressionAttributeValues: isStatusQuery ? 
            { ':t' : PetSortKeyMetadata, ':s': query.status }:
            { ':t' : PetSortKeyMetadata },
        FilterExpression: `#t = :t${isStatusQuery ? ' AND #s = :s' : ''}`
    };

    return dynamoDb.scan(params).promise().then(result => {
        log.info('createPet completed');
        return HttpResultV2(HttpStatusCode.OK, result.Items);
    }).catch(error => {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
