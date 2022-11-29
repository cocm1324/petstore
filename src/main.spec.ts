import { hello } from './main';

test('Test if it runs without error', () => {
    expect(hello()).toBeUndefined()
});
