import { APIGatewayEvent, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDB, S3 } from 'aws-sdk';
import { parse } from 'lambda-multipart-parser';
import { v4 } from 'uuid';
import * as log from 'lambda-log';

import { TableName, PetIdParamSchema, HttpStatusCode, UploadImagePetRequestBodySchema, IdPrefix } from '../models';
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
    const imageId = IdPrefix.Image + v4();

    try {
        const s3Params: S3.PutObjectRequest = {
            ACL: 'public-read',
            Bucket: 'petstore-sample-project',
            Key: 'image/' + imageId,
            Body: content,
            ContentType: contentType,
        }

        const s3Result = await s3.upload(s3Params).promise();
        const { Location } = s3Result;

        const dbParams: DynamoDB.DocumentClient.PutItemInput = {
            TableName: TableName.Pet,
            Item: {
                id: pathParameter.petId,
                type: imageId,
                name: filename,
                url: Location,
                additionalMetadata: value.additionalMetadata
            }
        }

        await dynamoDb.put(dbParams).promise();

        return HttpResultV2(HttpStatusCode.OK, {});
    } catch (error) {
        return HttpResultV2(HttpStatusCode.InternalServerError, error);
    };
}