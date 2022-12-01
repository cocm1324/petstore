import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const hello = (event: APIGatewayProxyEvent): APIGatewayProxyResult => {
    console.log(event);
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: "Go Serverless v3.0! Your function executed successfully!",
                input: event,
            },
        )
    };
}
