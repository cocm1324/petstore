import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';
import { parse } from 'lambda-multipart-parser';
import { v4 } from 'uuid';
import * as log from 'lambda-log';

import { TableName, PetSortKeyMetadata, PetIdParamSchema, HttpStatusCode, UploadImagePetRequestBodySchema, PetStatus } from '../models';
import { HttpResultV2 } from '../libs';

import credentials from '../../credentials.json';

const dynamoDb = new DynamoDB.DocumentClient();
const s3 = new S3(credentials);

export const uploadImagePet = async (event: APIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    log.options.meta.event = event;
    
    const timestamp = (new Date()).toISOString();

    const { value: pathParameter, error: paramError } = PetIdParamSchema.validate(event.pathParameters, { abortEarly: false });
    if (paramError) {
        const arrayOfMessage: string[] = paramError.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const contentTypeHeader = event.headers['content-type'] || event.headers['Content-Type'];
    if (!contentTypeHeader || !contentTypeHeader.includes('multipart/form-data')) {
        return HttpResultV2(HttpStatusCode.UnsupportedMediaType, { message: 'Media type is not supported' });
    }

    let result;
    try {
        result = await parse(event);
    } catch(error) {
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    }

    const { value, error } = UploadImagePetRequestBodySchema.validate(result, { abortEarly: false, allowUnknown: true });
    if (error) {
        const arrayOfMessage: string[] = error.details.map(element => element.message);
        const message = JSON.stringify({ message: arrayOfMessage });
        log.error(message);
        return HttpResultV2(HttpStatusCode.Invalid, { message: arrayOfMessage });
    }

    const { filename, contentType, content } = value.files[0];

    const imageId = v4();
    const imageMetadata = {
        url: '',
        filename: filename,
        metadata: value.additionalMetadata
    };
    const s3Params: S3.PutObjectRequest = {
        ACL: 'public-read',
        Bucket: 'petstore-sample-project',
        Key: 'image/' + imageId,
        Body: content,
        ContentType: contentType,
    }
    return s3.upload(s3Params).promise().then(result => {
        const { Location } = result;
        imageMetadata.url = Location;

        const dbParams: DynamoDB.DocumentClient.UpdateItemInput = {
            TableName: TableName.Pet,
            Key: {
                id: pathParameter.petId,
                type: PetSortKeyMetadata
            },
            ExpressionAttributeValues: { 
                ':id': pathParameter.petId,
                ':i': [ imageMetadata.url ],
                ':u': timestamp
            },
            ConditionExpression: 'id = :id AND',
            UpdateExpression: 'SET photoUrls = list_append(photoUrls, :i), updatedAt = :u',
        }
        return dynamoDb.update(dbParams).promise();
    }).then(result => {
        return HttpResultV2(HttpStatusCode.OK, imageMetadata);
    }).catch(error => {
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    });
}