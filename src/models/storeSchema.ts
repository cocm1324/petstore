import * as Joi from 'joi';
import { PetOrderStatus } from './enums';

export const CreateStoreOrderRequestBodySchema = Joi.object({
    petId: Joi.string()
        .uuid()
        .required(),
    
    quantity: Joi.number()
        .integer()
        .positive()
        .default(1),
    
    shipDate: Joi.date(),

    status: Joi.string()
        .valid(...Object.values(PetOrderStatus))
        .default(PetOrderStatus.Placed),
    
    complete: Joi.boolean()
        .default(false)
});
