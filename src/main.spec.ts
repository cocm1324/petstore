import { APIGatewayProxyEvent } from 'aws-lambda';
import { hello } from './main';

const mockEvent: APIGatewayProxyEvent = {
    headers: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    pathParameters: {},
    multiValueHeaders: {},
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    stageVariables: null,
    requestContext: {
        accountId: '',
        apiId: '',
        authorizer: null,
        protocol: 'http',
        httpMethod: 'GET',
        identity: {
            accessKey: '',
            accountId: '',
            apiKey: '',
            apiKeyId: '',
            caller: null,
            clientCert: null,
            cognitoAuthenticationProvider: null,
            cognitoAuthenticationType: null,
            cognitoIdentityId: null,
            cognitoIdentityPoolId: null,
            principalOrgId: null,
            sourceIp: '',
            user: null,
            userAgent: null,
            userArn: null
        },
        path: '/',
        stage: '',
        requestId: '',
        requestTimeEpoch: 0,
        resourceId: '',
        resourcePath: '' 
    },
    resource: '',
    body: ''
}

test('Test if it runs without error', async () => {
    expect(hello(mockEvent)).toBeDefined();
});
