import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, CreateStoreOrderRequestBodySchema, PetStatus, HttpStatusCode, PetSortKey } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const createStoreOrder = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const timestamp = (new Date()).toISOString();
    
    const body = event.body ? JSON.parse(event.body) : {};

    const { value, error } = CreateStoreOrderRequestBodySchema
        .validate(body, { abortEarly: false });
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const params: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
            {
                Put: {
                    TableName: TableName.Pet,
                    Item: {
                        id: value.petId,
                        type: PetSortKey.Order,
                        quantity: value.quantity,
                        shipDate: value.shipDate,
                        status: value.status,
                        complete: value.complete
                    }
                }
            },
            {
                Update: {
                    TableName: TableName.Pet,
                    Key: {
                        id: value.petId,
                        type: PetSortKey.Metadata
                    },
                    ExpressionAttributeNames: { '#s': 'status' },
                    ExpressionAttributeValues: { 
                        ':id': value.petId, 
                        ':as': PetStatus.Available, 
                        ':ps': PetStatus.Pending,
                        ':u': timestamp
                    },
                    ConditionExpression: 'id = :id AND #s = :as',
                    UpdateExpression: 'SET #s = :ps, updatedAt = :u'
                }
            }
        ]
    }

    return dynamoDb.transactWrite(params).promise().then(result => {
        return HttpResultV2(HttpStatusCode.Created, result);
    }).catch(error => {
        log.error(JSON.stringify(error));
        if (error.message.includes('ConditionalCheckFailed')) {
            return HttpResultV2(HttpStatusCode.NotFound, { message: 'Item with provided petId is not found' });
        }
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
