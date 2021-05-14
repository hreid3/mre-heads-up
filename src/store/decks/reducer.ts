import { createReducer } from '@reduxjs/toolkit';
import { ApplicationState, DecksState } from "../../models/application";
import { loadDecksSuccess } from "./actions";

const initialState: DecksState = {
	loading: false,
	decks: [],
}
const reducer = createReducer(initialState, (builder => {
	builder
		.addCase(loadDecksSuccess, ((state, {payload}) => {
			state.loading = payload.loading;
			state.decks = payload.decks
		}));
}));

export default reducer;
