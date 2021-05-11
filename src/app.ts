/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import store from './store';
import { setAppStarted } from './store/app/actions';
/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
		this.context.onStopped(() => this.stopped());
	}

	private started() {
		store.dispatch(setAppStarted(true))
		console.log("App Started")
	}

	private stopped() {
		store.dispatch(setAppStarted(false));
		console.log("App Stopped");
	}
}
