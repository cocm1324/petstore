import { inputSchema, PetStatus } from './create-pet';

test('Validation Test1: minimum required', () => {
    const testInput1 = {
        name: 'testname1',
        photoUrls: []
    };
    const { error } = inputSchema.validate(testInput1);
    expect(error).toBeUndefined();
});

test('Validation Test2: missing required field', () => {
    const testInput1 = {
        name: 'testname1',
    };
    const { error } = inputSchema.validate(testInput1);
    expect(error).toBeDefined();
});

test('Validation Test3: invalid enum', () => {
    const testInput1 = {
        photoUrls: [],
        name: 'testname1',
        status: 'pending1'
    };
    const { error } = inputSchema.validate(testInput1);
    expect(error).toBeDefined();
});

test('Validation test4: valid enum', () => {
    const testInput1 = {
        name: 'testname1',
        photoUrls: [],
        status: 'pending'
    };
    const { error } = inputSchema.validate(testInput1);
    expect(error).toBeUndefined();
});