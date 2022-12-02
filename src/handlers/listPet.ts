import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const listPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    log.options.meta.event = event;

    const params = {
        TableName: TableName.Pet,
    };

    return dynamoDb.scan(params).promise().then(result => {
        log.info('createPet completed');
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items)
        };
    }).catch(error => {
        log.error(JSON.stringify(error));
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    });
}
