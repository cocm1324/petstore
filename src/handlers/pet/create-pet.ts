import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 } from 'uuid';
import * as Joi from 'joi';

const dynamoDb = new DynamoDB.DocumentClient();
const idPrefix = 'pet#';
const metadataType = 'metadata';

export const createPet = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    
    const datetime = new Date().toISOString();
    const body = event.body ? JSON.parse(event.body) : {};

    const { value, error } = inputSchema.validate(body)
    if (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: error })
        };
    }

    const params = {
        TableName: 'pets',
        Item: {
            petId: idPrefix + v4(),
            type: metadataType,
            name: value.name,
            photoUrls: value.photoUrls,
            status: value.status,
            createdAt: datetime,
            updatedAt: datetime,
        }
    };

    let data;
    try {
        data = await dynamoDb.put(params).promise();
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error })
        }
    }

    return {
        statusCode: 201,
        body: JSON.stringify(data.ConsumedCapacity)
    };
}

export enum PetStatus {
    Available = 'available',
    Pending = 'pending',
    Sold = 'sold'
}

export const inputSchema = Joi.object({

    category: Joi.object({
        id: Joi.number().integer().min(0),
        name: Joi.string()
    }),

    name: Joi.string()
        .required(),
    
    photoUrls: Joi.array()
        .items(Joi.string())
        .required(),

    tags: Joi.array().items(Joi.object({
        id: Joi.number().integer().min(0),
        name: Joi.string()
    })),

    status: Joi.string()
        .valid(...Object.values(PetStatus))
        .default(PetStatus.Available)
});