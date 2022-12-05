import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { HttpStatusCode, PetSortKey, PetStatus, PetTableIndex, TableName } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const getStoreInventory = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    console.log(event);

    const params: DynamoDB.DocumentClient.ScanInput = {
        TableName: TableName.Pet,
        IndexName: PetTableIndex.Status,
        ExpressionAttributeNames: { '#t': 'type' },
        ExpressionAttributeValues: { ':t' : PetSortKey.Metadata },
        FilterExpression: '#t = :t',
    };

    const counter: { [n: string]: number } = { };
    Object.values(PetStatus).forEach(value => {
        counter[value] = 0;
    });

    try {
        const result = await dynamoDb.scan(params).promise();

        if (!result.Items) return HttpResultV2(HttpStatusCode.OK, counter);

        result.Items.forEach(item => {
            counter[item.status] += 1;
        });

        return HttpResultV2(HttpStatusCode.OK, counter);
    } catch(error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
