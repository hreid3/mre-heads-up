import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { Store } from "@reduxjs/toolkit";

export interface AppState {
	app: ApplicationState;
	decks: DecksState;
}

export interface ApplicationState {
	appStarted: boolean;
	gameSession: GameSession;
	displayResults: boolean;
}

export type ID = string|number;

export interface Deck {
	id: ID;
	name: string;
	description: string;
	playInstructions: string;
	cards: Card[];
	prefabUri: string;
	enabled: boolean;
	flipped?: boolean;
}

export interface Card {
	id: ID;
	value: string;
	type: "text"|"image";
}

export enum GAME_STATE {
	Playing,
	Waiting,
}

export type PlayedCard = { correct: boolean|undefined; card: Card };

export interface GameSession {
	selectedDeckId: ID;
	pile: Card[];
	head: PlayedCard;
	draw: PlayedCard[];
	passCount: number;
	correctCount: number;
	duration: number;
	timeRemaining: number;
	state: GAME_STATE;
	playerId: string;
	readyCountdownDuration: number;
}

export interface DecksState {
	loading: boolean;
	decks: Deck[];
}

export interface ApplicationManager {
	getContext: () => MRE.Context;
	getAppRoot: () => MRE.Actor;
	getAssetsContainer: () => MRE.AssetContainer;
	getStore: () => Store<AppState>;
	getAssets: () => MRE.Asset[];
}
