import * as Joi from 'joi';
import { PetOrderStatus, PetStatus } from './enums';

export const CreatePetRequestBodySchema = Joi.object({
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

export const UpdateStatusPetRequestBodySchema = Joi.object({
    name: Joi.string(),

    status: Joi.string()
        .valid(...Object.values(PetOrderStatus))
});

export const UploadImagePetRequestBodySchema = Joi.object({
    additionalMetadata: Joi.string(),

    files: Joi.array().min(1).required()
});