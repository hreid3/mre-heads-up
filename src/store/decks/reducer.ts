import { createReducer } from '@reduxjs/toolkit';
import { DecksState } from "../../models/application";
import { loadDecksSuccess, setFlipDeck } from "./actions";

const initialState: DecksState = {
	loading: false,
	decks: [],
}
const reducer = createReducer(initialState, (builder => {
	builder
		.addCase(loadDecksSuccess, ((state, {payload}) => {
			state.loading = payload.loading;
			state.decks = payload.decks
		}))
		.addCase(setFlipDeck, (state,{payload: {id, flipped}}) => {
			const deck = state.decks.find(value => value.id === id);
			deck.flipped = flipped;
		})
	;
}));

export default reducer;
