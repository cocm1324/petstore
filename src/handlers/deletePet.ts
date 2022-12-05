import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetIdParamSchema, HttpStatusCode, PetSortKey } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const deletePet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const params: DynamoDB.DocumentClient.DeleteItemInput = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKey.Metadata
        },
        ExpressionAttributeValues: { ':id': pathParameter.petId },
        ConditionExpression: 'id = :id'
    };

    return dynamoDb.delete(params).promise().then(result => {
        return HttpResultV2(HttpStatusCode.OK, result);

    }).catch(error => {
        if (error.code == 'ConditionalCheckFailedException') {
            return HttpResultV2(HttpStatusCode.NotFound, { message: 'Item with provided petId is not found' });
        }
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
