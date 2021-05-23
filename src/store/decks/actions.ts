import { createAction } from "@reduxjs/toolkit";
import { DecksState, ID } from "../../models/application";
import { withPayloadType } from "../utils";

export const LOAD_DECKS_SUCCESS = 'LOAD_DECKS_SUCCESS';
// export const LOAD_DECKS_FAILED = 'LOAD_DECKS_FAILED';
export const SET_FLIP_DECK = 'SET_FLIP_DECK';

export const loadDecksSuccess = createAction(
	LOAD_DECKS_SUCCESS,
	withPayloadType<DecksState>()
);

export const setFlipDeck = createAction(
	SET_FLIP_DECK,
	withPayloadType<{ id: ID; flipped: boolean }>()
);
