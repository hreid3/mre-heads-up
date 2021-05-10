/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet) {
		this.context.onStarted(() => this.started());
	}

	private started() {
		console.log("App Started")
	}
}
