import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, PetRequestPetIdParamSchema } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const getPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    log.options.meta.event = event;
    
    log.info('createPet started');
    
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

    const params: DynamoDB.DocumentClient.GetItemInput = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKeyMetadata
        }
    };

    return dynamoDb.get(params).promise().then(result => {
        if (!result.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Item with provided petId is not found' })
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(result.Item)
        };

    }).catch(error => {
        log.error(JSON.stringify(error));
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    });
}
