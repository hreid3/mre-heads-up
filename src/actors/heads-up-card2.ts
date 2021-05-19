import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import countdown from "countdown";
import wordwrap from "word-wrap";
import config from "../config";
import { Card, Deck, GameSession } from "../models/application";
import theme from "../theme/default";
import delay from "../utils/delay";
import { HeadsUpCollisionDetector } from "./heads-up-collision-detector";

const CARD_TEXT_HEIGHT = 0.18;
const soundOptions = config.soundOptions;

export class HeadsUpCard {
	private assets: MRE.AssetContainer;
	private readyCountdownTimer: countdown.Timespan|number;
	private gameSessionCountdownTimer: countdown.Timespan|number;
	private cardTextLabel: MRE.Actor;
	private readyCountdownLabel: MRE.Actor;
	private gameSessionCountdownLabel: MRE.Actor;
	private background: MRE.Actor;
	private actorRef: MRE.Actor[] = [];
	private base: MRE.Actor;
	private headsUpDownDetector: HeadsUpCollisionDetector;
	private headDownSoundAsset: MRE.Asset;
	private firstCardSoundAsset: MRE.Asset;
	private headUpSoundAsset: MRE.Asset;
	private preCountdownSoundAsset: MRE.Asset;
	private endGameSessionEndSoundAsset: MRE.Asset;
	private endingCountdownSoundAsset: MRE.Asset;

	private endGameSession: () => void;

	constructor(
		private context: MRE.Context,
		private gameSession: GameSession,
	) {
		this.assets = new MRE.AssetContainer(this.context);
	}

	protected loadCardText = (card: Card) => {
		if (card.value && this.cardTextLabel?.text) {
			const val = wordwrap(`${card.value}`, {
				width: 20
			});
			this.cardTextLabel.text.contents = val;
			if (val.length > 10) {
				this.cardTextLabel.text.height = CARD_TEXT_HEIGHT / 1.5;
			} else if (val.length > 20) {
				this.cardTextLabel.text.height = CARD_TEXT_HEIGHT / 2.5;
			} else {
				this.cardTextLabel.text.height = CARD_TEXT_HEIGHT;
			}
		}
	};
	public getPlayer = () => this.context.user(MRE.parseGuid(this.gameSession.playerId));
	public attachToPlayer = () => this.base.attach(this.getPlayer().id, "head");
	public startGaming = async () => {
		this.attachToPlayer();

		// Reset all game values
		await delay(config.playStartDelay || 0);
		const pile = this.gameSession.pile;
		if (!pile) {
			throw Error("Missing pile for " + this.gameSession.selectedDeckId);
		}
		// build card
		// this.buildCard();

		// Start pre-countdown
		await this.startReadyCountdown();
		this.headsUpDownDetector = new HeadsUpCollisionDetector(this.context, this.base, this.getPlayer());
		this.headsUpDownDetector.startCollectionDetection(this.handleHeadUpDownEvent);
		this.readyCountdownLabel.appearance.enabled = false;
		this.cardTextLabel.appearance.enabled = true;
		this.loadCardText(this.gameSession.head.card);
		this.base.startSound(this.firstCardSoundAsset?.id, {...soundOptions});
		console.log("Game started");
		// Play game
		this.startGameSessionCountdown().then(this.handleGameEndEvent);
	};
	protected createRedMaterial = () =>
		this.assets.createMaterial("red-mat-heads-up-card", {color: theme.color.background.playCardResult.pass});

	protected handleGameEndEvent = async () => {
		// Display results
		this.headsUpDownDetector.stopCollectionDetection();
		this.cardTextLabel.text.height = CARD_TEXT_HEIGHT + 0.05;
		this.cardTextLabel.text.contents = "Time Up!";
		this.background.appearance.material = this.assets.createMaterial("mat-heads-up-card-time-up",
			{color: theme.color.background.playCardResult.timeUp});

		this.base.startSound(this.endGameSessionEndSoundAsset?.id, {...soundOptions});
		await delay(config.timeUpDuration);
		this.base.detach();
		if (this.endGameSession) { this.endGameSession() }
		this.destroy();
		console.log("Game over");
	};

	onEndGameSession = (val: () => void) => {
		this.endGameSession = val;
	}

	protected handleHeadUpDownEvent = async (result: "top"|"bottom") => {
		if (this.headsUpDownDetector.isDetecting()) {
			const currentBg = this.background.appearance.material;
			const currentText = this.cardTextLabel.text;
			this.cardTextLabel.text.height = CARD_TEXT_HEIGHT + 0.05;
			if (result === "bottom") {
				setTimeout(() => this.base.startSound(this.headDownSoundAsset.id, {...soundOptions}), 250);
				// We need to flash the Correct card, change the bg to green
				this.background.appearance.material =
					this.assets.createMaterial("green-mat-heads-up-card",
						{color: theme.color.background.playCardResult.correct});
				this.cardTextLabel.text.contents = "Correct!";
			} else {
				setTimeout(() => this.base.startSound(this.headUpSoundAsset.id, {...soundOptions}), 250);
				// We need to flash the Pass card, change the bg to red
				this.background.appearance.material = this.createRedMaterial();
				this.cardTextLabel.text.contents = "Pass";
			}
			await delay(1000);
			if (this.headsUpDownDetector.isDetecting()) {
				this.cardTextLabel.text.contents = "";
				this.cardTextLabel.text.height = currentText.height;
				this.gameSession.head.correct = result === "bottom"
				this.gameSession.draw.push(this.gameSession.head);
				const card = this.gameSession.pile.shift();
				this.gameSession.head = {card, correct: false };
				this.loadCardText(this.gameSession.head.card);
				this.background.appearance.material = currentBg;
			}
		}
	};

	protected getBackground = (base: MRE.Actor, mat: MRE.Material, box: MRE.Mesh) => MRE.Actor.Create(this.context,
		{
			actor: {
				parentId: base.id,
				appearance: {
					meshId: box.id,
					materialId: mat.id,
					enabled: true
				},
				transform: {
					local: {
						position: {x: 0.0, y: 0.65, z: 0.0}
					}
				},
			}
		}
	);

	buildReadyCountdownLabel = (base: MRE.Actor) => MRE.Actor.Create(this.context, {
		actor: {
			parentId: base.id,
			appearance: {
				enabled: true
			},
			transform: {
				local: {
					position: {x: 0, y: 0.55, z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: `Hello World`,
				height: CARD_TEXT_HEIGHT,
				anchor: MRE.TextAnchorLocation.BottomCenter,
				justify: MRE.TextJustify.Center,
				color: theme.color.font.header
			}
		}
	});

	buildCardTextLabel = (base: MRE.Actor) => MRE.Actor.Create(this.context, {
		actor: {
			parentId: base.id,
			appearance: {
				enabled: false
			},
			transform: {
				local: {
					position: {x: 0, y: 0.60, z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: "",
				height: CARD_TEXT_HEIGHT,
				anchor: MRE.TextAnchorLocation.BottomCenter,
				justify: MRE.TextJustify.Center,
				color: theme.color.font.header
			}
		}
	});

	buildGameSessionCountdownLabel = (base: MRE.Actor) => MRE.Actor.Create(this.context, {
		actor: {
			parentId: base.id,
			appearance: {
				enabled: false
			},
			transform: {
				local: {
					position: {x: 0, y: 0.35, z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: "",
				height: CARD_TEXT_HEIGHT / 2,
				anchor: MRE.TextAnchorLocation.BottomCenter,
				justify: MRE.TextJustify.Center,
				color: theme.color.font.header
			}
		}
	});

	buildCard = () => {
		this.actorRef = [];
		const mat = this.assets.createMaterial("mat", {color: theme.color.background.default});
		const box = this.assets.createBoxMesh("box", 1.25, 0.8, 0.075);
		this.base = MRE.Actor.Create(this.context,
			{
				actor: {
					name: "HeadUpBox",
					transform: {
						local: {
							rotation: {y: 90}
						},
					},
					rigidBody: {
						isKinematic: true,
						useGravity: false,
					},
					collider: {
						geometry: {
							shape: MRE.ColliderType.Auto,
						},
						isTrigger: true,
					}
				}
			});
		this.base.collider.onTrigger('trigger-exit', () => {});
		this.background = this.getBackground(this.base, mat, box);
		this.readyCountdownLabel = this.buildReadyCountdownLabel(this.base);
		this.cardTextLabel = this.buildCardTextLabel(this.base);
		this.gameSessionCountdownLabel = this.buildGameSessionCountdownLabel(this.base);
		this.actorRef.push(this.base, this.background, this.readyCountdownLabel,
			this.cardTextLabel, this.gameSessionCountdownLabel);
		this.headDownSoundAsset = this.assets.createSound("head-down-sound",
			{uri: `/sounds/head-down.wav`}
		);
		this.headUpSoundAsset = this.assets.createSound(
			"head-up-sound",
			{uri: `/sounds/head-up.wav`}
		);
		this.preCountdownSoundAsset = this.assets.createSound(
			"pre-countdown-sound",
			{uri: `/sounds/count-down.wav`}
		);
		this.endGameSessionEndSoundAsset = this.assets.createSound(
			"end-game-session-sound",
			{uri: `/sounds/game-session-ended.wav`}
		);
		this.endingCountdownSoundAsset = this.assets.createSound(
			"final-count-down-sound",
			{uri: `/sounds/final-count-down.wav`}
		);
		this.firstCardSoundAsset = this.assets.createSound(
			"first-card-sound",
			{uri: `/sounds/display-text.wav`}
		);
	};

	public destroy() {
		this.actorRef.forEach(v => v.destroy());
		this.headsUpDownDetector?.destroy();
		this.onEndGameSession = null;
		this.context = null;
		this.base = null;
		this.base = null;
		this.gameSession = null;
		clearInterval(this.gameSessionCountdownTimer as any);
		clearInterval(this.readyCountdownTimer as any);
	}

	protected startReadyCountdown = () => {
		return new Promise(((resolve) => {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const __this = this;
			const start = new Date(Date.now() + this.gameSession.readyCountdownDuration);
			this.readyCountdownTimer =
				countdown(
					start,
					function(ts) {
						__this.readyCountdownLabel.text.contents = `${ts.seconds}`;
						if (ts.seconds > 0) {
							__this.base.startSound(__this.preCountdownSoundAsset?.id, {...soundOptions});
						}
						if (ts.seconds < 1) {
							resolve();
							// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
							// @ts-ignore
							clearInterval(__this.readyCountdownTimer);
						}
					},
					countdown.SECONDS);
		}));
	};

	protected startGameSessionCountdown = () => {
		this.gameSessionCountdownLabel.appearance.enabled = true;
		return new Promise(((resolve) => {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const __this = this;
			const start = new Date(Date.now() + this.gameSession.duration);
			this.gameSessionCountdownTimer =
				countdown(
					start,
					function(ts) {
						const min = `${ts.minutes < 10 ? "0" : ""}${ts.minutes}`;
						const sec = `${ts.seconds < 10 ? "0" : ""}${ts.seconds}`;
						__this.gameSessionCountdownLabel.text.contents = `${min}:${sec}`;
						if (ts.minutes < 1 && (ts.seconds < 10 && ts.seconds > 0)) {
							__this.base.startSound(__this.endingCountdownSoundAsset?.id, {...soundOptions});
						}
						if (ts.seconds < 1 && ts.minutes < 1) {
							resolve();
							// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
							// @ts-ignore
							clearInterval(__this.gameSessionCountdownTimer);
						}
					},
					countdown.SECONDS | countdown.MINUTES);
		}));
	};
}
