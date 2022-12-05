import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { HttpStatusCode, IdPrefix, TableName } from '../models';
import { HttpResultV2, petSerializer } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const listPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: TableName.Pet,
        ExpressionAttributeNames: { '#pk': 'id' },
        ExpressionAttributeValues: { ':pk': IdPrefix.Pet },
        FilterExpression: 'begins_with(#pk, :pk)'
    };

    try {
        const result = await dynamoDb.scan(params).promise();

        if (!result.Items) {
            return HttpResultV2(HttpStatusCode.OK, []);
        }

        const serialized = petSerializer(result.Items);
        return HttpResultV2(HttpStatusCode.OK, serialized);

    } catch (error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
