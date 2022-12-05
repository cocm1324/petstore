import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 } from 'uuid';
import * as log from 'lambda-log';

import { 
    TableName, CreatePetRequestBodySchema, HttpStatusCode, IdPrefix,
    PetSortKey, ImageSortKey, CategorySortKey 
} from '../models';
import { HttpResultV2 } from '../libs';

const dynamoDb = new DynamoDB.DocumentClient();

export const createPet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const timestamp = new Date().toISOString();

    const body = event.body ? JSON.parse(event.body) : {};
    const { value, error } = CreatePetRequestBodySchema.validate(body, { abortEarly: false })
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const petId = IdPrefix.Pet + v4();

    const dbParams: DynamoDB.DocumentClient.TransactWriteItemsInput = {
        TransactItems: []
    };
    const matadataParams: DynamoDB.DocumentClient.PutItemInput = {
        TableName: TableName.Pet,
        Item: {
            id: petId,
            type: PetSortKey.Metadata,
            category: value.category,
            name: value.name,
            status: value.status,
            tag: value.tag,
            photoUrls: value.photoUrls,
            createdAt: timestamp,
            updatedAt: timestamp
        }
    };
    dbParams.TransactItems.push({ Put: matadataParams });

    if (value.photoUrls && value.photoUrls.length > 0) {
        value.photoUrls.map((photo: string) => {
            const photoId = IdPrefix.Image + v4() 
            dbParams.TransactItems.push({ Put: {
                TableName: TableName.Pet,
                Item: {
                    id: petId,
                    type: photoId,
                    url: photo,
                    name: photoId
                }
            }});
        });
    }

    if (value.category) {
        const categoryId = IdPrefix.Category + value.category;
        dbParams.TransactItems.push({ Put: {
            TableName: TableName.Pet,
            Item: {
                id: petId,
                type: categoryId,
                name: value.category
            }
        }});
        dbParams.TransactItems.push({ Put: {
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
            dbParams.TransactItems.push({ Put: {
                TableName: TableName.Pet,
                Item: {
                    id: petId,
                    type: tagId,
                    name: tag
                }
            }});
            dbParams.TransactItems.push({ Put: {
                TableName: TableName.Pet,
                Item: {
                    id: tagId,
                    type: ImageSortKey.Metadata,
                    name: tag
                }
            }})
        });
    }

    try {
        const result = await dynamoDb.transactWrite(dbParams).promise();
        return HttpResultV2(HttpStatusCode.Created, {});
    } catch (error) {
        log.error(JSON.stringify(error));
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }
}

