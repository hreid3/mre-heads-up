import { createAction } from '@reduxjs/toolkit';
import { DecksState } from "../../models/application";
import { withPayloadType } from '../utils';
export const LOAD_DECKS_SUCCESS = 'LOAD_DECKS_SUCCESS';
export const LOAD_DECKS_FAILED = 'LOAD_DECKS_FAILED';

export const loadDecksSuccess = createAction(
	LOAD_DECKS_SUCCESS,
	withPayloadType<DecksState>()
);
