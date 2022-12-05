import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import * as log from 'lambda-log';

import { TableName, UpdatePetRequestBodySchema, PetIdParamSchema, HttpStatusCode, PetSortKey, IdPrefix, CategorySortKey, ImageSortKey } from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const updatePet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const datetime = new Date().toISOString();
    const body = event.body ? JSON.parse(event.body) : {};
    
    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const { value, error } = UpdatePetRequestBodySchema.validate(body, { abortEarly: false })
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const transactionParams: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: []
    }

    const isCategory = !!value.category;
    const isTags = !!value.tag;

    const attributeValues: { [key: string]: any } = {
        ':id': pathParameter.petId,
        ':n': value.name,
        ':s': value.status,
        ':u': datetime
    }
    if (isCategory) attributeValues[':c'] = value.category;
    if (isTags) attributeValues[':t'] = value.tags;

    const updateParams: DynamoDB.DocumentClient.Update = {
        TableName: TableName.Pet,
        Key: {
            id: pathParameter.petId,
            type: PetSortKey.Metadata
        },
        ExpressionAttributeNames: {
            '#n': 'name',
            '#s': 'status',
        },
        ExpressionAttributeValues: attributeValues,
        ConditionExpression: 'id = :id',
        UpdateExpression: `SET ${isCategory ? 'category = :c, ':''}#n = :n, #s = :s, ${isTags ? 'tags = :t,':''}updatedAt = :u`
    };
    transactionParams.TransactItems.push({ Update: updateParams });

    if (isCategory) {
        const categoryId = IdPrefix.Category + value.category;
        transactionParams.TransactItems.push({ Put: {
            TableName: TableName.Pet,
            Item: {
                id: pathParameter.petId,
                type: categoryId,
                name: value.category
            }
        }});
        transactionParams.TransactItems.push({ Put: {
            TableName: TableName.Pet,
            Item: {
                id: categoryId,
                type: CategorySortKey.Metadata,
                name: value.category
            }
        }});
    }

    if (value.tags && value.tags.length > 0) {
        value.tags.map((tag: any) => {
            const tagId = IdPrefix.Tag + tag;
            transactionParams.TransactItems.push({ Put: {
                TableName: TableName.Pet,
                Item: {
                    id: pathParameter.petId,
                    type: tagId,
                    name: tag
                }
            }});
            transactionParams.TransactItems.push({ Put: {
                TableName: TableName.Pet,
                Item: {
                    id: tagId,
                    type: PetSortKey.Metadata,
                    name: tag
                }
            }})
        });
    }

    return dynamoDb.transactWrite(transactionParams).promise().then(result => {
        return HttpResultV2(HttpStatusCode.OK, result);
    }).catch(error => {
        log.error(JSON.stringify(error));

        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}
