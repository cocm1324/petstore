import * as Joi from 'joi';
import { PetOrderStatus, PetStatus } from './enums';

export const CreatePetRequestBodySchema = Joi.object({
    category: Joi.string(),

    name: Joi.string()
        .required(),
    
    photoUrls: Joi.array()
        .items(Joi.string())
        .required(),

    tags: Joi.array()
        .items(Joi.string()),

    status: Joi.string()
        .valid(...Object.values(PetStatus))
        .default(PetStatus.Available)
});

export const PetIdParamSchema = Joi.object({
    petId: Joi.string()
        .min(1)
        .required()
});

export const OrderIdParamSchema = Joi.object({
    orderId: Joi.string()
        .min(1)
        .required()
});

export const UpdatePetRequestBodySchema = Joi.object({

    category: Joi.string(),

    name: Joi.string()
        .required(),

    status: Joi.string()
        .valid(...Object.values(PetStatus))
        .default(PetStatus.Available),
    
    tags: Joi.array()
        .items(Joi.string()),
});

export const UpdateStatusPetRequestBodySchema = Joi.object({
    name: Joi.string().default(''),

    status: Joi.string()
        .valid(...Object.values(PetOrderStatus))
});

export const UploadImagePetRequestBodySchema = Joi.object({
    additionalMetadata: Joi.string(),

    files: Joi.array().min(1).required()
});


export const CreateStoreOrderRequestBodySchema = Joi.object({
    petId: Joi.string()
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
