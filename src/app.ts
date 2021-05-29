/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { parseGuid } from "@microsoft/mixed-reality-extension-sdk";
import { Store } from "redux";
import { DeckSelection } from "./actors/deck-selection";
import { GameSessionResults } from "./actors/game-session-results";
import { HeadsUpCard } from "./actors/heads-up-card";
import { ApplicationManager, AppState, GAME_STATE, GameSession } from "./models/application";
import { createStore } from "./store";
import { playerDeckCanceled, setAppStarted } from "./store/app/actions";
import { loadDecksFromFileSystem } from "./store/decks/thunks";
import block from "./utils/block";
import delay from "./utils/delay";

/**
 * The main class of this Index. All the logic goes here.
 */
export default class App implements ApplicationManager {
	private deckSelection: DeckSelection;
	private appRoot: MRE.Actor;
	private gameSession: GameSession;
	private headsUpCard: HeadsUpCard;
	private assetContainer: MRE.AssetContainer;
	private gameSessionResults: GameSessionResults;
	private headsUpCardPrefab: MRE.Prefab;
	private backgroundPrefab: MRE.Prefab;
	private store: Store<AppState>;
	private assets: MRE.Asset[] = []

	constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet, private damBaseUri: string) {
		console.log("constructed", this.context.sessionId);
		this.context.onStarted(this.started);
		this.context.onStopped(this.stopped);
		this.context.onUserLeft(this.handleUserLeft);
		this.context.onUserJoined(this.handleUserJoined);
	}

	getContext = () => this.context;
	getAppRoot = () => this.appRoot;
	getAssetsContainer = () => this.assetContainer;
	getStore = () => this.store;
	getAssets = () => this.assets;

	private handleUserJoined = async (user: MRE.User) => {
		await block(() => this.getStore().getState().app.appStarted)
		this.deckSelection.attachBehaviors();
	};

	private handleUserLeft = (user: MRE.User) => {
		const playerId = this.store?.getState()?.app?.gameSession?.playerId;
		if (playerId === user.id.toString()) {
			this.store?.dispatch(playerDeckCanceled({}));
		}
	};

	private started = async () => {
		this.appRoot = MRE.Actor.Create(this.context, {actor: {name: "AppRoot"}});
		// Show Splash
		console.log("Loading Digital Assets from", this.damBaseUri || '/public');
		this.store = createStore();
		this.assetContainer = new MRE.AssetContainer(this.context);
		await Promise.all([
			this.assetContainer.loadGltf(`${this.damBaseUri}/models/heads-up-card.glb`, "box"),
			this.assetContainer.loadGltf(`${this.damBaseUri}/models/common-background-3.glb`, "box")
		]).then(([headsUpCardPrefabLoader, backgroundPrefabLoader] )=> {
			this.assets.push( ...headsUpCardPrefabLoader, ...backgroundPrefabLoader);
			this.headsUpCardPrefab = headsUpCardPrefabLoader.find(a => a.prefab !== null).prefab;
			this.backgroundPrefab = backgroundPrefabLoader.find(a => a.prefab !== null).prefab;
		});
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		this.store.dispatch(loadDecksFromFileSystem());
		await block(() => !!this.getStore().getState().decks.decks.length)
		const deckCardsPrefabs: Record<string, MRE.Prefab> = {};
		for(const deck of this.getStore().getState().decks.decks) {
			const loader = await this.assetContainer.loadGltf(`${this.damBaseUri}${deck.prefabUri}`, "box");
			const prefab = loader.find(a => a.prefab !== null)?.prefab;
			if (!prefab) {
				throw Error(`No prefeb defined for ${deck.name}`);
			}
			deckCardsPrefabs[deck.id] = prefab
		}

		this.deckSelection = new DeckSelection(this, this.backgroundPrefab, deckCardsPrefabs);
		this.gameSessionResults = new GameSessionResults(this, this.backgroundPrefab);
		// Listen for game start events
		this.detectChanges();

		delay(2500); // Splash delay
		// Destroy Splash
		this.store.dispatch(setAppStarted(true));
		console.log("App Started");
	};

	private stopped = () => {
		this.store.dispatch(setAppStarted(false));
		this.deckSelection?.destroy();
		this.headsUpCard?.destroy();
		this.gameSessionResults?.destroy();
		console.log("App Stopped");
	};

	private detectChanges = () => {
		this.store.subscribe(() => {
			const gameSession = this.store.getState().app.gameSession;
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
				this.headsUpCard = new HeadsUpCard(this, player, this.headsUpCardPrefab);
			} else if (gm.state === GAME_STATE.Waiting) {
				console.log("canceled");
				this.headsUpCard?.destroy();
			}
		}
	}
}
