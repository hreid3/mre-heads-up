import { createReducer } from '@reduxjs/toolkit';
import { ApplicationState } from '../../models/application';
import { setAppStarted } from './actions';

const initialState: ApplicationState = {
	appStarted: false,
}
const reducer = createReducer(initialState, (builder => {
	builder
    .addCase(setAppStarted, ((state, { payload } ) => { state.appStarted = payload; }));
}));

export default reducer;
