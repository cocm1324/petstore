import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { HttpStatusCode, IdPrefix, PetSortKey, TableName } from '../models';
import { HttpResultV2, petSerializer } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const listPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: TableName.Pet,
        ExpressionAttributeNames: { '#pk': 'id', '#sk': 'type' },
        ExpressionAttributeValues: { ':pk': IdPrefix.Pet, ':sk': PetSortKey.Metadata },
        FilterExpression: 'begins_with(#pk, :pk) AND #sk = :sk'
    };

    try {
        const result = await dynamoDb.scan(params).promise();

        if (!result.Items) {
            return HttpResultV2(HttpStatusCode.OK, []);
        }

        return HttpResultV2(HttpStatusCode.OK, result.Items);

    } catch (error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
