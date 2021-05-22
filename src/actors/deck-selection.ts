import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { Actor } from "@microsoft/mixed-reality-extension-sdk";
import wordwrap from "word-wrap";
import config from "../config";
import { ApplicationManager, Deck, DecksState, GAME_STATE, GameSession, ID } from "../models/application";
import { playerDeckCanceled, playerDeckSelected } from "../store/app/actions";
import { setFlipDeck } from "../store/decks/actions";
import theme from "../theme/default";

const playButtonName = "playButton";
const playButtonLabel = "label";
const DECK_CARD_PREFIX = 'deckCard_';

const getButtonLabel =
	(actor: MRE.Actor) => actor.children.find(v => v.name === playButtonLabel);

export class DeckSelection {
	private root: MRE.Actor;
	private gridLayout: MRE.PlanarGridLayout;
	private decksState: DecksState;
	private assets: MRE.AssetContainer;
	private actorDeckMapping: Record<string, Actor> = {};
	private playerButtonMapping: Record<string, Actor> = {};
	private gameSession: GameSession;
	private deckCards: Actor[] = [];
	private playButtonSoundAsset: MRE.Asset;
	private assetContainer: MRE.AssetContainer;

	constructor(private appManager: ApplicationManager) {
		this.assets = new MRE.AssetContainer(this.appManager.getContext());
		this.setup();
		this.detectChanges();
	}

	public destroy = () => {
		this.root?.destroy();
		this.actorDeckMapping = {};
		this.playerButtonMapping = {};
		this.deckCards?.forEach(v => {
			v.attachment?.userId && v.detach();
			if (v.collider) {
				v.collider.offTrigger("trigger-exit", () => {
				});
				v.collider.offTrigger("trigger-enter", () => {
				});
			}
			v.destroy();
		});
		this.deckCards = [];
	};

	public setOnlyDeckSelected = (value: boolean, selectedDeckId?: ID) => {
		const setBtnLbl = (actor: MRE.Actor, label: string, setDefaultColor?: boolean) => {
			const children = actor.children;
			for (const child of children) {
				if (child.name === playButtonName) {
					const grandChildren = child.children;
					for (const grandChild of grandChildren) {
						if (grandChild.name === playButtonLabel) {
							grandChild.text.contents = label;
							if (setDefaultColor) {
								grandChild.text.color = theme.color.button.default.text;
							}
						}
					}
					if (setDefaultColor) {
						child.appearance.material.color = MRE.Color4.FromColor3(theme.color.button.default.background);
					}
				}
			}
		};
		// if (this.decksState.decks) {
		// 	if (value && selectedDeckId) {
		// 		for (const deck of this.decksState.decks) {
		// 			const actor = this.actorDeckMapping[deck.id];
		// 			actor.appearance.enabled = selectedDeckId === deck.id;
		// 			setBtnLbl(actor, "Cancel");
		// 			this.layoutCards([actor]);
		// 		}
		// 	} else if (!this.deckCards?.length) {
		// 		const deckCards: Actor[] = [];
		// 		for (const deck of this.decksState.decks) {
		// 			const actor = this.actorDeckMapping[deck.id];
		// 			deckCards.push(actor);
		// 			actor.appearance.enabled = deck.enabled;
		// 			setBtnLbl(actor, "Play", true);
		// 		}
		// 		this.layoutCards(deckCards);
		// 	}
		// }
	};

	protected detectChanges = () => {
		this.appManager.getStore().subscribe(() => {
			const decks = this.appManager.getStore().getState().decks;
			const gameSession = this.appManager.getStore().getState().app.gameSession;
			if (this.decksState !== decks) {
				this.decksState = decks;
				if (!this.deckCards?.length) {
					this.setup();
				}
				// this.destroy();
				// this.setup();
			}
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
		if (prev.selectedDeckId !== gm.selectedDeckId) {
			this.setOnlyDeckSelected(!!gm.selectedDeckId, gm.selectedDeckId);
		}
	}

	private setup = () => {
		console.log("Decks change detected");
		this.assetContainer = new MRE.AssetContainer(this.appManager.getContext());

		this.root = MRE.Actor.Create(this.appManager.getContext(), {
			actor: {
				name: "DeckSelectionRoot",
				parentId: this.appManager.getAppRoot().id
			}
		});
		this.deckCards = [];
		if (this.decksState?.decks) {
			for (const deck of this.decksState.decks) {
				if (deck.enabled) {
					const deckCard = this.createDeck(deck);
					this.deckCards.push(deckCard);
					this.actorDeckMapping[deck.id] = deckCard;
				}
			}
			this.layoutCards(this.deckCards);
		}
		this.playButtonSoundAsset = this.assets.createSound(
			"final-count-down",
			{uri: `/sounds/play-button.wav`}
		);

	};

	private layoutCards = (deckCards: Actor[]) => {
		let i = 0;
		this.gridLayout = new MRE.PlanarGridLayout(this.root);
		for (const deckCard of deckCards) {
			this.gridLayout.addCell({
				row: 0,
				height: 1,
				column: i++,
				width: 0.9,
				contents: deckCard
			});
		}
		this.gridLayout.applyLayout();
	};
	// eslint-disable-next-line max-len
	private getDeckTitle = (deck: Deck, base: MRE.Actor, box: MRE.Mesh, mat: MRE.Material) => MRE.Actor.Create(this.appManager.getContext(), {
		actor: {
			parentId: base.id,
			appearance: {
				meshId: box.id,
				materialId: mat.id,
				enabled: true
			},
			transform: {
				local: {
					position: {x: 0, y: 0, z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: `${wordwrap(deck.name)}`,
				height: 0.070,
				anchor: MRE.TextAnchorLocation.BottomCenter,
				justify: MRE.TextJustify.Center,
				color: theme.color.font.header
			}
		}
	});

	// eslint-disable-next-line max-len
	private getDeckDesc = (deck: Deck, base: MRE.Actor, box: MRE.Mesh, mat: MRE.Material) => MRE.Actor.Create(this.appManager.getContext(), {
		actor: {
			parentId: base.id,
			appearance: {
				meshId: box.id,
				materialId: mat.id,
				enabled: true
			},
			transform: {
				local: {
					position: {z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: `${wordwrap(deck.description, {width: 40})}`,
				height: 0.035,
				anchor: MRE.TextAnchorLocation.MiddleCenter,
				justify: MRE.TextJustify.Left,
				color: theme.color.font.paragraph
			}
		}
	});

	private getDeckPrefab = async (deck: Deck, base: MRE.Actor) => {
		const loader = await this.assetContainer.loadGltf(deck.prefabUri, "box");
		const prefab = loader.find(a => a.prefab !== null)?.prefab;
		if(!prefab) {
			throw Error(`No prefeb defined for ${deck.name}`);
		}
		return MRE.Actor.CreateFromPrefab(this.appManager.getContext(),
			{
				prefab,
				actor: {
					name: `${DECK_CARD_PREFIX}prefab_${deck.id}`,
					parentId: base.id,
					transform: {
						local: {
							position: { x: 0.0, y: 0.0, z: 0.0 }
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
	}

	// Todo: This qualifies for a Atomic Component
	private getPlayButton = (base: MRE.Actor, deck: Deck) => {
		const mat = this.assets.createMaterial("mat", {color: theme.color.button.default.background});
		const box = this.assets.createBoxMesh("box", 0.22, 0.075, 0.0005);
		const playButton = MRE.Actor.Create(this.appManager.getContext(),
			{
				actor: {
					parentId: base.id,
					name: playButtonName,
					appearance: {
						meshId: box.id,
						materialId: mat.id,
						enabled: true
					},
					transform: {
						local: {
							position: {x: -0.122, y: -0.27, z: 0.0015},
							rotation: base.transform.local.rotation,
						}
					},
					collider: {
						geometry: {
							shape: MRE.ColliderType.Auto
							// size: { x: 0.5, y: 0.5, z: 0.5 }
						},
						isTrigger: true
					}
				}
			}
		);
		playButton.collider.onTrigger("trigger-enter", () => {
		});
		console.log("Horace", { ...base.transform.local.rotation })
		const label = MRE.Actor.Create(this.appManager.getContext(), {
			actor: {
				name: playButtonLabel,
				parentId: playButton.id,
				transform: {local: {position: {z: 0.005, y: 0},
					rotation: { y: 45 },
				}},
				text: {
					contents: "Play",
					pixelsPerLine: 12,
					height: 0.045,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: theme.color.button.default.text
				}
			}
		});
		this.playerButtonMapping[deck.id] = playButton;
		return playButton;
	};

	public attachBehaviors = () => {
		for (const deck of this.decksState.decks) {
			this.attachPlayButtonBehaviors(deck);
			this.attachDeckCardBehaviors(deck);
		}
	};

	protected attachDeckCardBehaviors = (deck: Deck) => {
		const deckBase = this.deckCards.find(value => `${DECK_CARD_PREFIX}${deck.name}` === value.name);
		const deckCardBehavior = deckBase.setBehavior(MRE.ButtonBehavior);
		deckCardBehavior.onHover("enter", user => {

		});
		deckCardBehavior.onHover("enter", user => {

		});
		deckCardBehavior.onClick(user => {
			const updatedDeck = this.decksState.decks.find(value => value.id === deck.id);
			if (!updatedDeck.flipped) {
				// Flip the card and activate the playbutton
				deckBase.transform.local.rotation.y = 90;
			} else {
				deckBase.transform.local.rotation.y = 0;
				this.appManager.getStore().dispatch(setFlipDeck({id: deck.id, flipped: false }))
			}
			this.appManager.getStore().dispatch(setFlipDeck({id: deck.id, flipped: !updatedDeck.flipped }))
		})
	}

	protected attachPlayButtonBehaviors = (deck: Deck) => {
		const playButton = this.playerButtonMapping[deck.id];
		const label = getButtonLabel(playButton);
		const {disable, default: defaultColor, hover} = theme.color.button;
		const buttonBehavior = playButton.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onHover("enter", ((user, actionData) => {
			playButton.appearance.material.color = MRE.Color4.FromColor3(hover.background);
			label.text.color = hover.text;
		}));
		buttonBehavior.onHover("exit", ((user, actionData) => {
			playButton.appearance.material.color =
				MRE.Color4.FromColor3(this.gameSession?.state === GAME_STATE.Waiting
					? defaultColor.background : disable.background);
			label.text.color = this.gameSession?.state === GAME_STATE.Waiting ?
				defaultColor.text : disable.text;
		}));
		buttonBehavior.onClick((user, actionData) => {
			console.log("clicked");
			if (this.gameSession.state === GAME_STATE.Playing) {
				// TODO: Prompt to be sure.
				this.appManager.getStore().dispatch(playerDeckCanceled({playerId: user.id.toString()}));
				label.text.contents = 'Play';
			} else {
				this.root.startSound(this.playButtonSoundAsset?.id, {...config.soundOptions });
				label.text.contents = 'Cancel';
				this.appManager.getStore().dispatch(playerDeckSelected({
					selectedDeckId: deck.id,
					playerId: user.id.toString()
				}));
			}
		});
	}

	// eslint-disable-next-line max-len
	private getDeckBackground = (base: MRE.Actor, mat: MRE.Material, box: MRE.Mesh) => MRE.Actor.Create(this.appManager.getContext(),
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
						position: {x: 0.0, y: -0.1, z: 0.0}
					}
				},
				// rigidBody: {
				// 	isKinematic: true,
				// },
				collider: {
					geometry: {
						shape: MRE.ColliderType.Auto
						// size: { x: 0.5, y: 0.5, z: 0.5 }
					},
					isTrigger: true
				}
			}
		}
	);

	private createDeck = (deck: Deck) => {
		const mat = this.assets.createMaterial("mat", {color: theme.color.background.default});
		const box = this.assets.createBoxMesh("box", 0.8, 1, 0.075);
		const base = MRE.Actor.Create(
			this.appManager.getContext(), {
				actor: {
					name: `${DECK_CARD_PREFIX}${deck.name}`,
					parentId: this.root.id,
					transform: { local: { rotation: { y: deck.flipped ? 9 : 0 } },},
					collider: {
						geometry: {
							shape: MRE.ColliderType.Auto
							// size: { x: 0.5, y: 0.5, z: 0.5 }
						},
						isTrigger: true
					}
				}});
		// this.getDeckBackground(base, mat, box);
		this.getDeckPrefab(deck, base)
		// const title = this.getDeckTitle(deck, base, box, mat);
		// const description = this.getDeckDesc(deck, base, box, mat);
		this.getPlayButton(base, deck);
		// const textLayout = new MRE.PlanarGridLayout(base);
		// textLayout.addCell({
		// 	row: 0,
		// 	height: 0.0,
		// 	column: 0,
		// 	width: .45,
		// 	contents: title
		// });
		//
		// textLayout.addCell({
		// 	row: 1,
		// 	height: 0.4,
		// 	column: 0,
		// 	width: .45,
		// 	contents: description
		// });
		// textLayout.applyLayout();
		return base;
	};
}
