import { createAction } from "@reduxjs/toolkit";
import { ID } from "../../models/application";
import { withPayloadType } from "../utils";

export const APP_STARTED = 'APP_STARTED';
export const PLAYER_DECK_SELECTED = 'PLAYER_DECK_SELECTED';
export const PLAYER_DECK_CANCELED = 'PLAYER_DECK_CANCELED';

export const setAppStarted = createAction(APP_STARTED, withPayloadType<boolean>());

export const playerDeckSelected = createAction(PLAYER_DECK_SELECTED,
	withPayloadType<{ playerId?: string; selectedDeckId: ID }>()
)

export const playerDeckCanceled = createAction(PLAYER_DECK_CANCELED,
	withPayloadType<{ playerId: string}>()
)
