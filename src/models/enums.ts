export enum PetStatus {
    Available = 'available',
    Pending = 'pending',
    Sold = 'sold'
}

export enum PetOrderStatus {
    Placed = 'placed',
    Approved = 'approved',
    Delivered = 'delivered'
}

export enum TableName {
    Pet = 'pet'
}

export enum HttpStatusCode {
    OK = 200,
    Created = 201,
    Invalid = 400,
    NotFound = 404,
    UnsupportedMediaType = 415,
    InternalServerError = 500
}