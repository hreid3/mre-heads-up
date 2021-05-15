import { createReducer } from "@reduxjs/toolkit";
import config from "../../config";
import { ApplicationState, GAME_STATE } from "../../models/application";
import { playerDeckCanceled, playerDeckSelected, setAppStarted } from "./actions";

const initialState: ApplicationState = {
	appStarted: false,
	gameSession: {
		state: GAME_STATE.Waiting,
		duration: config.duration,
		correctCount: 0,
		draw: [],
		pile: [],
		passCount: 0,
		selectedDeckId: 0,
		timeRemaining: config.duration,
		playerId: '',
	},
}

const reducer = createReducer(initialState, (builder => {
	builder
    .addCase(setAppStarted, ((state, { payload } ) => { state.appStarted = payload; }))
		.addCase(playerDeckSelected, ((state, { payload: { selectedDeckId, playerId}}) => {
			state.gameSession.playerId = playerId;
			state.gameSession.selectedDeckId = selectedDeckId;
			state.gameSession.state = GAME_STATE.Playing;
		}))
		.addCase(playerDeckCanceled, ((state, { payload: { playerId}}) => {
			state.gameSession.playerId = '';
			state.gameSession.selectedDeckId = '';
			state.gameSession.state = GAME_STATE.Waiting;
		}))
	;
}));

export default reducer;
