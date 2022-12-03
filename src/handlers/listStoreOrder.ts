import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';
import { HttpResultV2 } from '../libs';

import { HttpStatusCode, PetSortKeyOrder, TableName } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const listStoreOrder = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: TableName.Pet,
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: { ':t' : PetSortKeyOrder },
        FilterExpression: '#t = :t'
    };

    return dynamoDb.scan(params).promise().then(result => {
        log.info('createPet completed');
        return HttpResultV2(HttpStatusCode.OK, result.Items);
    }).catch(error => {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
