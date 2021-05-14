/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { DeckSelection } from "./actors/decks/deck-selection";
import store from './store';
import { setAppStarted } from './store/app/actions';
import { loadDecksFromFileSystem } from "./store/decks/thunks";
/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
	private assets: MRE.AssetContainer;
	private deckSelection: DeckSelection;
	private appRoot: MRE.Actor;

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
		console.log("App Started")
	}

	private stopped() {
		store.dispatch(setAppStarted(false));
		this.deckSelection?.destroy();
		console.log("App Stopped");
	}
}
