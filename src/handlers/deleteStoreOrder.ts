import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';
import { HttpResultV2 } from '../libs';

import { TableName, PetSortKeyMetadata, OrderIdParamSchema, PetSortKeyOrder, PetStatus, PetOrderStatus, HttpStatusCode } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const deleteStoreOrder = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const timestamp = (new Date()).toISOString();
    
    const { value: pathParameter, error: paramError } = OrderIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const params: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
            {
                Delete: {
                    TableName: TableName.Pet,
                    Key: {
                        id: pathParameter.orderId,
                        type: PetSortKeyOrder,
                    },
                    ExpressionAttributeNames: { '#s': 'status' },
                    ExpressionAttributeValues: { ':id': pathParameter.orderId, ':ds': PetOrderStatus.Delivered },
                    ConditionExpression: 'id = :id AND NOT #s = :ds'
                }
            },
            {
                Update: {
                    TableName: TableName.Pet,
                    Key: {
                        id: pathParameter.orderId,
                        type: PetSortKeyMetadata
                    },
                    ExpressionAttributeNames: { '#s': 'status' },
                    ExpressionAttributeValues: { 
                        ':id': pathParameter.orderId, 
                        ':ss':PetStatus.Sold, 
                        ':as': PetStatus.Available,
                        ':u': timestamp,
                    },
                    ConditionExpression: 'id = :id AND NOT #s = :ss',
                    UpdateExpression: 'SET #s = :as, updatedAt = :u'
                }
            }
        ]
    }

    return dynamoDb.transactWrite(params).promise().then(result => {
        return HttpResultV2(HttpStatusCode.OK, result);
    }).catch(error => {
        if (error.code == 'ConditionalCheckFailedException') {
            return HttpResultV2(HttpStatusCode.NotFound, { message: 'Item with provided petId is not found' });
        }
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
