import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as Joi from 'joi';
import * as log from 'lambda-log';

import { HttpStatusCode, PetSortKey, PetStatus, PetTableIndex, TableName } from '../models';
import { HttpResultV2, petSerializer } from '../libs';

const partiQL = new DynamoDB();
const dynamoDb = new DynamoDB.DocumentClient();

export const findPetByStatusQuerySchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(PetStatus))
        .required()
}).required().messages({'any.required':'query is required'});

export const findPetByStatus = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;

    const { value: query, error: queryError } = findPetByStatusQuerySchema.validate(event.queryStringParameters);
    if (queryError) {
        const arrayOfMessage: string[] = queryError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    try {
        const statusScanParams: DynamoDB.DocumentClient.ScanInput = {
            TableName: TableName.Pet,
            IndexName: PetTableIndex.Status,
            ExpressionAttributeNames: { '#t': 'type', '#s': 'status' },
            ExpressionAttributeValues: { ':t' : PetSortKey.Metadata, ':s': query.status },
            FilterExpression: '#t = :t AND #s = :s',
        };
        const statusScanResult = await dynamoDb.scan(statusScanParams).promise();

        if (!statusScanResult.Items || statusScanResult.Items.length == 0) return HttpResultV2(HttpStatusCode.OK, []);
        return HttpResultV2(HttpStatusCode.OK, statusScanResult.Items);

        // if (!result.Items || result.Items.length == 0) return HttpResultV2(HttpStatusCode.OK, []);
        // const serialized = petSerializer(result.Items);

        // return HttpResultV2(HttpStatusCode.OK, serialized);

    } catch (error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}
