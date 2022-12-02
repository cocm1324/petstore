import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, UpdatePetRequestBodySchema, PetRequestPetIdParamSchema } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const updatePet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    log.options.meta.event = event;
    
    log.info('createPet started');
    const datetime = new Date().toISOString();
    const body = event.body ? JSON.parse(event.body) : {};
    
    const { value: pathParameter, error: paramError } = PetRequestPetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return {
            statusCode: 400,
            body: message
        }; 
    }

    const { value, error } = UpdatePetRequestBodySchema.validate(body, { abortEarly: false })
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

    const params: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKeyMetadata
        },
        ExpressionAttributeNames: {
            '#n': 'name',
            '#s': 'status'
        },
        ExpressionAttributeValues: {
            ':id': pathParameter.petId,
            ':n': value.name,
            ':p': value.photoUrls,
            ':s': value.status,
            ':u': datetime
        },
        UpdateExpression: 'set #n = :n, photoUrls = :p, #s = :s, updatedAt = :u',
        ConditionExpression: 'id = :id'
    };

    return dynamoDb.update(params).promise().then(result => {
        console.log(result);
        log.info('createPet completed');
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };

    }).catch(error => {
        log.error(JSON.stringify(error));

        if (error.code == 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Item with provided petId is not found' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    });
}
