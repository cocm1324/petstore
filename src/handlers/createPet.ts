import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 } from 'uuid';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, CreatePetRequestBodySchema, HttpStatusCode } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const createPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    log.info('createPet started');
    const timestamp = new Date().toISOString();

    const body = event.body ? JSON.parse(event.body) : {};
    const { value, error } = CreatePetRequestBodySchema.validate(body, { abortEarly: false })
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
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
            createdAt: timestamp,
            updatedAt: timestamp,
        }
    };

    return dynamoDb.put(params).promise().then(result => {
        log.info('createPet completed');
        return HttpResultV2(HttpStatusCode.Created, params.Item);
    }).catch(error => {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
