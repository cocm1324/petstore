import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 } from 'uuid';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, CreatePetRequestBodySchema } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const createPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    log.options.meta.event = event;
    
    log.info('createPet started');
    const datetime = new Date().toISOString();
    const body = event.body ? JSON.parse(event.body) : {};

    const { value, error } = CreatePetRequestBodySchema.validate(body, { abortEarly: false })
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return {
            statusCode: 400,
            body: message
        };
    }
    log.info('createPet validation completed');

    const params = {
        TableName: TableName.Pet,
        Item: {
            id: v4(),
            type: PetSortKeyMetadata,
            name: value.name,
            photoUrls: value.photoUrls,
            status: value.status,
            createdAt: datetime,
            updatedAt: datetime,
        }
    };

    return dynamoDb.put(params).promise().then(result => {
        log.info('createPet completed');
        return {
            statusCode: 201,
            body: JSON.stringify(params.Item)
        };
    }).catch(error => {
        log.error(JSON.stringify(error));
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    });
}
