/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { Actor } from "@microsoft/mixed-reality-extension-sdk";
import { DeckSelection } from "./actors/deck-selection2";
import { HeadsUpCard } from "./actors/heads-up-card2";
import config from "./config";
import { Deck, GAME_STATE, GameSession } from "./models/application";
import { loadDecks } from "./store/decks/thunks";
import shuffle from "./utils/shuffle";

const getInitialGameSessionState = (): GameSession => ({
	state: GAME_STATE.Waiting,
	duration: config.duration,
	correctCount: 0,
	draw: [],
	pile: [],
	head: undefined,
	passCount: 0,
	selectedDeckId: 0,
	timeRemaining: config.duration,
	playerId: '',
	readyCountdownDuration: config.readyCountdownDuration,
});
/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
	private assets: MRE.AssetContainer;
	private appRoot: MRE.Actor;
	private decks: Deck[];
	private gameSession: GameSession;
	private playerButtonMapping: Record<string, Actor> = {};
	private playButtonSoundAsset: MRE.Sound;
	private headsUpCard: HeadsUpCard;

	constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet) {
		console.log("contructed");
		this.context.onStarted(this.started);
		this.context.onStopped(this.stopped);
		this.context.onUserJoined(this.handleUserJoined);
	}

	private handleUserJoined = (user: MRE.User) => {
		// this.headsUpCard.buildCard();
		this.attachBehaviors();
	}
	private started = async () => {
		this.decks = await loadDecks();
		this.assets = new MRE.AssetContainer(this.context);
		this.appRoot = MRE.Actor.Create(this.context, {
			actor: {
				name: "appRoot",
			}
		});
		this.fetchAssets();
		this.gameSession = getInitialGameSessionState();
		this.setupDecks();
		this.headsUpCard = new HeadsUpCard(
			this.context,
			this.gameSession,
		);
		this.headsUpCard.onEndGameSession(this.handleEndGameSession);
	}

	private stopped = () => {
	}
	
	private setupDecks = () => {
		const deckSelection = new DeckSelection(this.context, this.appRoot, this.decks);
		this.playerButtonMapping = deckSelection.playerButtonMapping;
		// const {disable, default: defaultColor, hover} = theme.color.button;
		// const buttonBehavior = playButton.setBehavior(MRE.ButtonBehavior);
		// buttonBehavior.onHover("enter", ((user, actionData) => {
		// 	playButton.appearance.material.color = MRE.Color4.FromColor3(hover.background);
		// 	label.text.color = hover.text;
		// }));
		// buttonBehavior.onHover("exit", ((user, actionData) => {
		// 	playButton.appearance.material.color =
		// 		MRE.Color4.FromColor3(this.gameSession?.state === GAME_STATE.Waiting
		// 			? defaultColor.background : disable.background);
		// 	label.text.color = this.gameSession?.state === GAME_STATE.Waiting ?
		// 		defaultColor.text : disable.text;
		// }));
	}

	protected attachBehaviors = () => {
		for(const deck of this.decks) {
			const playButton = this.playerButtonMapping[deck.id];
			const buttonBehavior = playButton.setBehavior(MRE.ButtonBehavior);
			buttonBehavior.onClick((user, actionData) => {
				console.log("clicked");
				// if (this.gameSession.state === GAME_STATE.Playing) {
				// 	// TODO: Prompt to be sure.
				// 	// store.dispatch(playerDeckCanceled({playerId: user.id.toString()}));
				// } else {
				this.appRoot.startSound(this.playButtonSoundAsset?.id, {...config.soundOptions});
				if (this.gameSession.state === GAME_STATE.Waiting) {
					// this.gameSession = getInitialGameSessionState();
					this.gameSession.state = GAME_STATE.Playing;
					this.gameSession.playerId = user.id.toString();
					this.gameSession.selectedDeckId = deck.id;
					this.gameSession.pile = shuffle(deck.cards);
					const card = this.gameSession.pile.shift();
					this.gameSession.head = {card, correct: false};
					this.headsUpCard.buildCard();
					this.headsUpCard.startGaming();
				}
				// const headsUpCard = new HeadsUpCard(
				// 	this.context,
				// 	this.gameSession,
				// );
				// headsUpCard.buildCard();
				// headsUpCard.onEndGameSession(this.handleEndGameSession);
				// headsUpCard.startGaming();
				// }
			});
		}
	}
	protected handleEndGameSession = () => {
		this.gameSession.state = GAME_STATE.Waiting;

	}

	protected fetchAssets = () => {
		this.playButtonSoundAsset = this.assets.createSound(
			'final-count-down',
			{ uri: `/sounds/play-button.wav` },
		);

	}
}
