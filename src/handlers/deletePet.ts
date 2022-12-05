import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, PetIdParamSchema, HttpStatusCode } from '../models';
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

    try {
        const scanParam: DynamoDB.DocumentClient.ScanInput = {
            TableName: TableName.Pet,
            ExpressionAttributeNames: { '#t': 'type' },
            ExpressionAttributeValues: { ':id': pathParameter.petId }, 
            FilterExpression: 'id = :id',
            ProjectionExpression: '#t'
        }

        const scanResult = await dynamoDb.scan(scanParam).promise();

        if (!scanResult.Items || scanResult.Items.length == 0) return HttpResultV2(HttpStatusCode.OK, {});
        const deleteRequests = scanResult.Items.map(item => {
            return {
                DeleteRequest: {
                    Key: {
                        'id': pathParameter.petId,
                        'type': item.type
                    }
                }
            }
        });

        const batchDeleteParam: DynamoDB.DocumentClient.BatchWriteItemInput = {
            RequestItems: { [TableName.Pet]: deleteRequests }
        }
        const batchDeleteResult = await dynamoDb.batchWrite(batchDeleteParam).promise();

        return HttpResultV2(HttpStatusCode.OK, {});

    } catch (error) {
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
