import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';
import { HttpResultV2 } from '../libs';

import { HttpStatusCode, PetSortKeyMetadata, PetStatus, TableName } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const getStoreInventory = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    console.log(event);

    const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: TableName.Pet,
        ExpressionAttributeNames: { '#t': 'type', '#s': 'status' },
        ExpressionAttributeValues: { ':t' : PetSortKeyMetadata },
        FilterExpression: '#t = :t',
        ProjectionExpression: '#s'
    };

    const counter: { [n: string]: number } = { };
    Object.values(PetStatus).forEach(value => {
        counter[value] = 0;
    });

    return dynamoDb.scan(params).promise().then(result => {
        console.log(result);
        if (!result.Items) {
            return HttpResultV2(HttpStatusCode.OK, counter);
        }
        result.Items.forEach(item => {
            counter[item.status] += 1;
        });
        return HttpResultV2(HttpStatusCode.OK, counter);
    }).catch(error => {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
