import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, UpdatePetRequestBodySchema, PetIdParamSchema, HttpStatusCode, PetSortKey } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const updatePet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const datetime = new Date().toISOString();
    const body = event.body ? JSON.parse(event.body) : {};
    
    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const { value, error } = UpdatePetRequestBodySchema.validate(body, { abortEarly: false })
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const params: DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKey.Metadata
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
        return HttpResultV2(HttpStatusCode.OK, result);
    }).catch(error => {
        log.error(JSON.stringify(error));

        if (error.code == 'ConditionalCheckFailedException') {
            return HttpResultV2(HttpStatusCode.NotFound, { message: 'Item with provided petId is not found' });
        }
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
