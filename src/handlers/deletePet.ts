import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, PetRequestPetIdParamSchema } from '../../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const deletePet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    log.options.meta.event = event;
    
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

    const params: DynamoDB.DocumentClient.DeleteItemInput = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKeyMetadata
        },
        ExpressionAttributeValues: { ':id': pathParameter.petId },
        ConditionExpression: 'id = :id'
    };

    return dynamoDb.delete(params).promise().then(result => {
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };

    }).catch(error => {
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
