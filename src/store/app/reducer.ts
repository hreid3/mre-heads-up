import { createReducer } from "@reduxjs/toolkit";
import config from "../../config";
import { ApplicationState, GAME_STATE, GameSession } from "../../models/application";
import {
	drawCard,
	initializeGameSession,
	playerDeckCanceled,
	playerDeckSelected,
	recordUserSelection,
	setAppStarted
} from "./actions";

const initialSessionValues: Partial<GameSession> = {
	// duration: config.duration,
	correctCount: 0,
	draw: [],
	passCount: 0,
	timeRemaining: config.duration,
} ;

const initialState: ApplicationState = {
	appStarted: false,
	gameSession: {
		state: GAME_STATE.Waiting,
		duration: config.duration,
		correctCount: 0,
		draw: [],
		pile: [],
		head: undefined,
		passCount: 0,
		selectedDeckId: 0,
		timeRemaining: config.duration,
		playerId: '',
		readyCountdownDuration: config.readyCountdownDuration,
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
		.addCase(initializeGameSession, ((state, { payload: { pile }}) => {
			state.gameSession = { ...state.gameSession, ...initialSessionValues }
			state.gameSession.pile = pile;
		}))
		.addCase(drawCard, (state => {
			if (state.gameSession.pile.length) {
				const card = state.gameSession.pile.shift();
				if (state.gameSession.head) {
					state.gameSession.draw.push(state.gameSession.head);
				}
				state.gameSession.head = { card, correct: undefined };
			}
		}))
		.addCase(recordUserSelection, (state, { payload}) => {
			state.gameSession.head.correct = payload;
		})
	;
}));

export default reducer;
