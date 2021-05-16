/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { parseGuid, User } from "@microsoft/mixed-reality-extension-sdk";
import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { DeckSelection } from "./actors/decks/deck-selection";
import { HeadsUpCard } from "./actors/decks/heads-up-card";
import { GAME_STATE, GameSession } from "./models/application";
import store from "./store";
import { setAppStarted } from "./store/app/actions";
import { loadDecksFromFileSystem } from "./store/decks/thunks";

/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
	private assets: MRE.AssetContainer;
	private deckSelection: DeckSelection;
	private appRoot: MRE.Actor;
	private gameSession: GameSession;
	private headsUpCard: HeadsUpCard;

	constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet) {
		console.log("contructed");
		this.context.onStarted(() => this.started());
		this.context.onStopped(() => this.stopped());
	}

	private started() {
		this.appRoot = MRE.Actor.Create(this.context, {
			actor: {
				name: 'AppRoot',
			}
		});

		store.dispatch(setAppStarted(true));
		store.dispatch(loadDecksFromFileSystem());
		this.deckSelection = new DeckSelection(this.context, this.appRoot);
		// Listen for game start events
		this.detectChanges();
		console.log("App Started")
	}

	private stopped() {
		store.dispatch(setAppStarted(false));
		this.deckSelection?.destroy();
		console.log("App Stopped");
	}

	private detectChanges = () => {
		store.subscribe(() => {
			const gameSession = store.getState().app.gameSession;
			if (this.gameSession !== gameSession) {
				const prev = this.gameSession;
				this.gameSession = gameSession;
				if (prev && this.gameSession) {
					this.handleGameSessionChanged(prev);
				}
			}
		})
	}

	private handleGameSessionChanged(prev: GameSession) {
		const gm = this.gameSession;
		if (gm.state !== prev.state) {
			if (gm.state === GAME_STATE.Playing) {
				const player = this.context.user(parseGuid(this.gameSession.playerId));
				this.headsUpCard?.destroy();
				this.headsUpCard = new HeadsUpCard(this.context, this.appRoot, player);
			} else if (gm.state === GAME_STATE.Waiting) {
				this.headsUpCard?.destroy();
			}
		}
	}
}
