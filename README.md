# petstore
A sample project for demonstrating capability to implement simple full-stack application

## About Project

### Objective
[API docs](https://petstore.swagger.io)
- Objective of this project is to implement above API except for user
- To demonstrate ability to create service, utilized target tech stack, and problem solving skills.

### Business Logic
- Business logics are about Petstore orders and inventory
- A petstore employee can 1) create a pet, 2) update the pet, 3) read pet's data, or 4) delete the pet in the store inventory.
- A customer can 1) create an order, 2) read the order.
- After an order is placed, the employ can change the order state to approve or deliver.
- The employee can add photos to the pet inventory

## Demonstration Via Postman
-

## About Architecture

### Cloud Formation Deploy via Serverless
[formation](https://miro.medium.com/max/1400/1*c4lIbMQLDydxSzc_Q68t7w.webp)
- I could configure cloud formation via serverless.yml
- Via serveless configuration, API Gateway, Lambda functions, DynamoDB and CloudWatch log will be automatically configured
- S3 was configured manually

### Overally Architecture
[arch](https://user-images.githubusercontent.com/17560082/205744326-c1c7847c-6973-4761-a111-c1796626ace3.png)
- HTTP request comes to API gateway
- API gateway redirect request Lambda function that associated with request route
- Lambda function will perform computational work such as using DB, save files on S3, or logging.


## About Data

### Entities
[data](https://user-images.githubusercontent.com/17560082/205663257-8127d216-4b62-45f0-8829-3a716febf086.png)
- There are 5 different data entities
- The point is that 'pet' is related to every other entities and acts as a primary entites

### DynamoDB
[dynamodb key](https://d2908q01vomqb2.cloudfront.net/887309d048beef83ad3eabf2a79a64a389ab1c9f/2018/09/10/dynamodb-partition-key-1.gif)
- DynamoDB has unique key system: a partition key or partition key / sort key combination as a primary key
- We can have efficient design by grouping entities with single partition key. Entities would be sort key
- Items with same partition key are placed near to each other. Groupping them and querying with partition key will make good performance

### Data Modeling
[pet table](https://user-images.githubusercontent.com/17560082/205738851-9cfaa10d-9bb4-4eb9-8176-f1e36d6d4959.png)
- Since every entities are related to pet, PetID would be the partition key
- Each other entities will be represented as sortkey. For example, an order of pet can be accessed with a key [{petId}, 'order']
- There can be duplicate Tags and Categories among pets. To track all tags and categories, save it separately.

### Special Cases for Indexing
[index](https://user-images.githubusercontent.com/17560082/205740679-8e6f162a-7004-4a0d-9599-23bbe48e55d3.png)
- In the API spec, we can find 2 APIs that filter for 'status' and count distict 'status'
- Scan throughout all database and filtering out would be slow
- We can have secondary index for 'status' to increase performance

## About API Design
[ids](https://user-images.githubusercontent.com/17560082/205741593-c6bb3ef0-b2e5-489c-9fb6-45db713a7df2.png)
For API Design, I only want to mention about the differences with original [API docs](https://petstore.swagger.io)
- Pet ID: petId is changed from integer64 to string. This is because to hold UUID, as well as the partition key should hold the prefix 'pet-'
- Order ID: Since store/order and pet are one to one relationship, there is no need to have separate id for order. It is changed to have same partition key as pet, and now has sort key as 'order'

## Others

### Project Management
[github projects](https://user-images.githubusercontent.com/17560082/205745122-8b7f4080-15c6-4186-84d4-e6bf8665fffc.png)
- I used [github project](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects) to keep track of the preject progress.
- Kanban board style project was used.
- Good thing about Github Project is that items on board can be directly marked as issue, and can be connected to pull requests. Which helps to take down each tasks in development phase as well as tracking issues at the maintenance phase

### Git Flow
[messy](https://user-images.githubusercontent.com/17560082/205746221-ccef7221-42d8-4cbc-8f5c-dbd3e95b8acd.png)
- It is bit messy but this is my recent git flow of my project.
- Usually I trys to follow main-development-feature branch style
- main branch is for release
- development branch is for ongoing developing and staging
- feature branchss are for developing new features
- issue branches can be used when urgent fix is needed to main branch


## Additional Subjects
- [ ] Explain how API Gateway and AWS Lambda interact vs using an Express Framework
- [ ] Explain how authentication would be implemented with API Gateway using AWS Cognito
- [ ] Demonstrate how to use CloudWatch Logs to show error conditions
- [ ] Demonstrate how to use CloudWatch Logs to support development
- [ ] Explain how the areas of improvement for scalability or highlight areas where particular attention was given to scalability
- [ ] Explain any other technologies and how/why they were used in the demonstration
- [ ] Demonstrate a Git flow that shows how you would maintain a development branch along with a main branch used for production
- [ ] Identify and implement improvements to the swagger design (example, look at how id’s are created and handled on POSTs)
