import { createAction } from "@reduxjs/toolkit";
import { Card, ID } from "../../models/application";
import { withPayloadType } from "../utils";

export const APP_STARTED = 'APP_STARTED';
export const PLAYER_DECK_SELECTED = 'PLAYER_DECK_SELECTED';
export const PLAYER_DECK_CANCELED = 'PLAYER_DECK_CANCELED';
export const INIT_GAME_SESSION = 'INIT_GAME_SESSION';
export const GAME_SESSION_ENDED = 'GAME_SESSION_ENDED';
export const DRAW_CARD = 'DRAW_CARD';
export const RECORD_USER_SELECTION = 'RECORD_USER_SELECTION';
export const SET_DISPLAY_RESULTS = 'SET_DISPLAY_RESULTS';

export const setAppStarted = createAction(APP_STARTED, withPayloadType<boolean>());

export const playerDeckSelected = createAction(PLAYER_DECK_SELECTED,
	withPayloadType<{ playerId: string; selectedDeckId: ID }>()
)

export const playerDeckCanceled = createAction(PLAYER_DECK_CANCELED,
	withPayloadType<{ playerId?: string}>()
)

export const initializeGameSession = createAction(INIT_GAME_SESSION, withPayloadType<{ pile: Card[] }>());

export const endGameSession = createAction(GAME_SESSION_ENDED, withPayloadType<void>());

export const drawCard = createAction(DRAW_CARD, withPayloadType<{}>());

export const recordUserSelection = createAction(RECORD_USER_SELECTION, withPayloadType<boolean>());

export const setDisplayResults = createAction(SET_DISPLAY_RESULTS, withPayloadType<boolean>());
