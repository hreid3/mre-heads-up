import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import countdown from "countdown";
import wordwrap from "word-wrap";
import { DecksState, GameSession } from "../models/application";
import store from "../store";
import { drawCard, initializeGameSession, recordUserSelection } from "../store/app/actions";
import { AbstractChangeDetection } from "../store/common/AbstractChangeDetection";
import theme from "../theme/default";
import shuffle from "../utils/shuffle";
import { HeadsUpCollisionDetector } from "./heads-up-collision-detector";

const CARD_TEXT_HEIGHT = 0.18;

export class HeadsUpCard extends AbstractChangeDetection {
	private root: MRE.Actor;
	private decksState: DecksState;
	private assets: MRE.AssetContainer;
	private readyCountdownTimer: countdown.Timespan|number;
	private gameSessionCountdownTimer: countdown.Timespan|number;
	private cardTextLabel: MRE.Actor;
	private readyCountdownLabel: MRE.Actor;
	private gameSessionCountdownLabel: MRE.Actor;
	private actorRef: MRE.Actor[] = [];
	private headsUpDownDetector: HeadsUpCollisionDetector;

	constructor(private context: MRE.Context, private parent: MRE.Actor, private player: MRE.User) {
		super();
		this.assets = new MRE.AssetContainer(this.context);
		this.startGaming();
	}

	protected loadCardText = () => {
		if (this.gameSession?.head?.card?.value && this.cardTextLabel?.text) {
			const val = wordwrap(`${this.gameSession?.head?.card?.value}`, {
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

	private startGaming = async () => {
		// Reset all game values
		this.decksState = store.getState().decks;
		this.gameSession = store.getState().app.gameSession;
		const pile = this.decksState.decks.find(v => v.id === this.gameSession?.selectedDeckId)?.cards;
		if (!pile) {
			throw Error("Missing pile for " + this.gameSession.selectedDeckId);
		}
		store.dispatch(initializeGameSession({pile: shuffle(pile)}));
		store.dispatch(drawCard({}));
		// build card
		this.buildCard();

		// Start pre-countdown
		this.headsUpDownDetector = new HeadsUpCollisionDetector(this.context, this.parent, this.player);
		this.headsUpDownDetector.startCollectionDetection(this.handleHeadUpDownEvent);
		await this.startReadyCountdown();
		this.readyCountdownLabel.appearance.enabled = false;

		this.cardTextLabel.appearance.enabled = true;
		this.loadCardText();
		console.log("Game started");
		// Play game
		this.startGameSessionCountdown().then(() => {
			// Display results
			this.headsUpDownDetector.stopCollectionDetection();
			console.log("Game over");
		});
	};

	protected handleHeadUpDownEvent = (result: "top" | "bottom") => {
		store.dispatch(recordUserSelection(result === "bottom"));
		store.dispatch(drawCard({}));
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
				collider: {
					geometry: {
						shape: MRE.ColliderType.Auto
					},
					isTrigger: true
				}
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
					position: { x: 0, y: 0.55, z: -0.05 }
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
		const mat = this.assets.createMaterial("mat", {color: theme.color.background});
		const box = this.assets.createBoxMesh("box", 1.25, 0.8, 0.075);
		this.root = MRE.Actor.Create(this.context, {
			actor: {
				name: "HeadsUpCardRoot",
				parentId: this.parent.id
			}
		});
		const base = MRE.Actor.Create(this.context,
			{
				actor: {
					parentId: this.root.id,
					transform: {
						local: {
							rotation: {y: 90}
						}
					}
				}
			});
		base.attach(this.player.id, "head");
		const bg = this.getBackground(base, mat, box);
		this.readyCountdownLabel = this.buildReadyCountdownLabel(base);
		this.cardTextLabel = this.buildCardTextLabel(base);
		this.gameSessionCountdownLabel = this.buildGameSessionCountdownLabel(base);
		this.actorRef.push(base, this.root, bg, this.readyCountdownLabel,
			this.cardTextLabel, this.gameSessionCountdownLabel);
	};

	handleGameSessionChanged(prev: GameSession): void {
		this.loadCardText();
	}

	public destroy() {
		this.actorRef.forEach(v => v.destroy());
		this.headsUpDownDetector?.destroy();
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