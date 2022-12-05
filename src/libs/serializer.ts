import { DynamoDB } from "aws-sdk";
import { IdPrefix, PetSortKey } from "../models";

export const petSerializer = (items: DynamoDB.DocumentClient.ItemList): any[] => {
    const petMap: {[petId: string]: any} = {};

    items.forEach(item => {
        if (!(item.id in petMap)) {
            petMap[item.id] = { id: item.id };
        }

        if (item.type == PetSortKey.Metadata) {
            petMap[item.id] = { ...petMap[item.id], ...item }
        }

        if (item.type.includes(IdPrefix.Image)) {
            if (!('photoUrls' in petMap[item.id])) petMap[item.id]['photoUrls'] = [];
            petMap[item.id]['photoUrls'].push(item.url);
        }

        if (item.type.includes(IdPrefix.Tag)) {
            if (!('tags' in petMap[item.id])) petMap[item.id]['tags'] = [];
            petMap[item.id]['tags'].push(item.name);
        }

        if (item.type.includes(IdPrefix.Category)) {
            petMap[item.id]['catetory'] = item.name;
        }
    });

    return Object.values(petMap);
}