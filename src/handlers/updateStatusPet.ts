import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { parse } from 'lambda-multipart-parser';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { HttpStatusCode, PetIdParamSchema, PetOrderStatus, PetSortKeyMetadata, PetSortKeyOrder, PetStatus, TableName, UpdateStatusPetRequestBodySchema } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const updateStatusPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const timestamp = (new Date()).toISOString();

    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
        return HttpResultV2(HttpStatusCode.UnsupportedMediaType, { message: 'Media type is not supported' });
    }

    let result;
    try {
        result = await parse(event);
    } catch(error) {
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }

    const { value, error } = UpdateStatusPetRequestBodySchema.validate(result, { abortEarly: false, allowUnknown: true });
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const isCompleted = value.status == PetOrderStatus.Delivered;
    const params: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: [
            {
                Update: {
                    TableName: TableName.Pet,
                    Key: {
                        id: pathParameter.petId,
                        type: PetSortKeyOrder,
                    },
                    ExpressionAttributeNames: { '#s': 'status' },
                    ExpressionAttributeValues: { 
                        ':id': pathParameter.petId, 
                        ':ds': PetOrderStatus.Delivered,
                        ':d': isCompleted ? timestamp : null,
                        ':s': value.status,
                        ':c': isCompleted ? true : false
                    },
                    ConditionExpression: 'id = :id AND NOT #s = :ds',
                    UpdateExpression: 'SET #s = :s, complete = :c, shipDate = :d'
                }
            },
            {
                Update: {
                    TableName: TableName.Pet,
                    Key: {
                        id: pathParameter.petId,
                        type: PetSortKeyMetadata,
                    },
                    ExpressionAttributeNames: { '#n': 'name', '#s': 'status' },
                    ExpressionAttributeValues: { 
                        ':id': pathParameter.petId, 
                        ':n': value.name, 
                        ':s': isCompleted ? PetStatus.Sold : PetStatus.Pending,
                        ':u': timestamp
                    },
                    ConditionExpression: 'id = :id',
                    UpdateExpression: 'SET #n = :n, #s = :s, updatedAt = :u'
                }
            }
        ]
    }

    return dynamoDb.transactWrite(params).promise().then(result => {
        console.log(result);
        return HttpResultV2(HttpStatusCode.OK, { message: 'completed' });
    }).catch(error => {
        log.error(error);
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
