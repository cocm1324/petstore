import { APIGatewayProxyResultV2 } from "aws-lambda";
import { HttpStatusCode } from "../models";

export const HttpResultV2 = (statusCode: HttpStatusCode, body: any): APIGatewayProxyResultV2 => {
    return { statusCode, headers: {"content-type": "application/json"}, body: JSON.stringify(body) };
}