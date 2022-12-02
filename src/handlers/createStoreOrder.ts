import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, PetSortKeyOrder, CreateStoreOrderRequestBodySchema } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const createStoreOrder = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    log.options.meta.event = event;
    
    const body = event.body ? JSON.parse(event.body) : {};

    const { value, error } = CreateStoreOrderRequestBodySchema
        .validate(body, { abortEarly: false });
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return {
            statusCode: 400,
            body: message
        };
    }

    const params: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
            {
                ConditionCheck: {
                    TableName: TableName.Pet,
                    Key: {
                        id: value.petId,
                        type: PetSortKeyMetadata
                    },
                    ExpressionAttributeValues: { ':id': value.petId },
                    ConditionExpression: 'id = :id'
                }
            },
            {
                Put: {
                    TableName: TableName.Pet,
                    Item: {
                        id: value.petId,
                        type: PetSortKeyOrder,
                        quantity: value.quantity,
                        shipDate: value.shipDate,
                        status: value.status,
                        complete: value.complete
                    }
                    
                }
            }
        ]
    };

    return dynamoDb.transactWrite(params).promise().then(result => {
        return {
            statusCode: 201,
            body: JSON.stringify(result.$response)
        };
    }).catch(error => {
        log.error(JSON.stringify(error));
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        }
    });
}
