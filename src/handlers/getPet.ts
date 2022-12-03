import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';
import { HttpResultV2 } from '../libs';

import { TableName, PetSortKeyMetadata, PetIdParamSchema, HttpStatusCode } from '../models';

const dynamoDb = new DynamoDB.DocumentClient();

export const getPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const params: DynamoDB.DocumentClient.GetItemInput = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKeyMetadata
        }
    };

    return dynamoDb.get(params).promise().then(result => {
        if (!result.Item) return HttpResultV2(HttpStatusCode.NotFound, { message: 'Item with provided petId is not found' });
        return HttpResultV2(HttpStatusCode.OK, result.Item);
    }).catch(error => {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}