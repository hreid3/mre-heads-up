import { setAppStarted } from './actions';

test('setAppStarted', () => {
	expect(setAppStarted(true)).toEqual({
		type: 'APP_STARTED',
		payload: true,
	})
})
