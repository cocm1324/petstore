# petstore
A sample project for demonstrating capability to implement simple full-stack application


# Project Description
[API docs](https://petstore.swagger.io)
Objective of this project is to implement above API except for user.


### Tech Stack Used
- Node.js with TypeScript
- Serverless
- AWS: CloudFormation, CloudWatch, DynamoDB, Lambda, S3

### Business Logic


### Data Modeling
In this step, I am going to define the structure of DB table.

### API and Business Logic Specification

- Primary APIs are about pet and store
- Store is API for customer to place order to store
- Pet is API for administration. Pet would be used by employee


### Data Structure
- Even if the API is splited into 2, there is no need to separate structures.
- All API is about Pet which is stocked in store. Only Pet would be modeled
- use of partition key and sort key

![Image](https://user-images.githubusercontent.com/17560082/205215755-e33302ca-d96b-444d-8a0f-7b38a5190fc4.png)


### Endpoints
```
[Health Check]
GET - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/

[Upload Image of the Pet]
POST - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet/{petId}/uploadImage

[Create a Pet]
POST - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet

[List Pets (with query for filtering status)]
GET - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet

[Get a Pet]
GET - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet/{petId}

[Update a Pet]
PUT - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet/{petId}

[Change Status of a Pet]
POST - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet/{petId}

[Delete a Pet]
DELETE - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/pet/{petId}


POST - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/store/order
GET - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/store/order
GET - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/store/order/{orderId}
DELETE - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/store/order/{orderId}
GET - https://82tydndjvi.execute-api.us-west-1.amazonaws.com/store/inventory
```