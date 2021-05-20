/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { parseGuid } from "@microsoft/mixed-reality-extension-sdk";
import { DeckSelection } from "./actors/deck-selection";
import { GameSessionResults } from "./actors/game-session-results";
import { HeadsUpCard } from "./actors/heads-up-card";
import { GAME_STATE, GameSession } from "./models/application";
import store from "./store";
import { playerDeckCanceled, setAppStarted } from "./store/app/actions";
import { loadDecksFromFileSystem } from "./store/decks/thunks";

/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
	private deckSelection: DeckSelection;
	private appRoot: MRE.Actor;
	private gameSession: GameSession;
	private headsUpCard: HeadsUpCard;
	private assets: MRE.AssetContainer;
	private gameSessionResults: GameSessionResults;
	private headsUpCardPrefab: MRE.Prefab;

	constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet) {
		console.log("constructed", this.context.sessionId);
		this.assets = new MRE.AssetContainer(this.context);
		this.assets.loadGltf( '/models/heads-up-card.glb', 'box')
			.then(headsUpCardPrefabLoader => {
				this.headsUpCardPrefab = headsUpCardPrefabLoader.find(a => a.prefab !== null).prefab;
			});
		this.context.onStarted(this.started);
		this.context.onStopped(this.stopped);
		this.context.onUserLeft(this.handleUserLeft);
		this.context.onUserJoined(this.handleUserJoined);
	}

	private handleUserJoined = (user: MRE.User) => {
		this.deckSelection.attachBehaviors();
	}

	private handleUserLeft = (user: MRE.User) => {
		const playerId = store?.getState()?.app?.gameSession?.playerId;
		if (playerId === user.id.toString()) {
			store?.dispatch(playerDeckCanceled({}));
		}
	}

	private started = () => {
		this.appRoot = MRE.Actor.Create(this.context, {actor: {name: "AppRoot"}});
		store.dispatch(setAppStarted(true));
		store.dispatch(loadDecksFromFileSystem());
		this.deckSelection = new DeckSelection(this.context, this.appRoot);
		this.gameSessionResults = new GameSessionResults(this.context, this.appRoot);
		// Listen for game start events
		this.detectChanges();
		console.log("App Started");
	}

	private stopped = () => {
		store.dispatch(setAppStarted(false));
		this.deckSelection?.destroy();
		this.headsUpCard?.destroy();
		this.gameSessionResults?.destroy();
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
		});
	};

	private handleGameSessionChanged(prev: GameSession) {
		const gm = this.gameSession;
		if (gm.state !== prev.state) {
			if (gm.state === GAME_STATE.Playing) {
				const player = this.context.user(parseGuid(this.gameSession.playerId));
				this.headsUpCard?.destroy();
				this.headsUpCard = new HeadsUpCard(this.context, this.appRoot, player, this.headsUpCardPrefab);
			} else if (gm.state === GAME_STATE.Waiting) {
				console.log("canceled");
				this.headsUpCard?.destroy();
			}
		}
	}
}
