import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { Actor } from "@microsoft/mixed-reality-extension-sdk";
import wordwrap from "word-wrap";
import config from "../config";
import { ApplicationManager, Deck, DecksState, GAME_STATE, GameSession, ID } from "../models/application";
import { playerDeckCanceled, playerDeckSelected } from "../store/app/actions";
import { setFlipDeck } from "../store/decks/actions";
import theme from "../theme/default";
import noop from "../utils/noop";

const playButtonName = "playButton";
const playButtonLabel = "label";
const DECK_CARD_PREFIX = "deckCard_";

const GrowScaleKeyframes = (scaleFactor: number) => {
	const item: Array<MRE.Keyframe<MRE.Vector3>> = [
		{ time: 0, value: { x: 1, y: 1, z: 1 }, easing: MRE.AnimationEaseCurves.EaseInQuadratic },
		{ time: 0.25, value: { x: scaleFactor, y: scaleFactor, z: 1 } }
	];
	return item
}
const ShrinkScaleKeyframes = (scaleFactor: number) => {
	const item: Array<MRE.Keyframe<MRE.Vector3>> = [
		{ time: 0, value: { x: scaleFactor, y: scaleFactor, z: 1 }, easing: MRE.AnimationEaseCurves.Step },
		{ time: 0.25, value: { x: 1, y: 1, z: 1 } }
	];
	return item
}
const popKeyframes = (distance: number) => {
	const item: Array<MRE.Keyframe<MRE.Vector3>> = [
		{ time: 0, value: { x: 0, y: 0, z: 0 } },
		{ time: 0.25, value: { x: 0, y: 0, z: distance } }
	];
	return item
}

const FlipKeyframes: Array<MRE.Keyframe<MRE.Quaternion>> = [
	{ time: 0, value: MRE.Quaternion.FromEulerAngles(0, 0, 0) },
	{ time: 0.25, value: MRE.Quaternion.FromEulerAngles(0, Math.PI, 0) },
];

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
	private deckCards: MRE.Actor[] = [];
	private backDrop: MRE.Actor;
	private playButtonSoundAsset: MRE.Asset;
	private assetContainer: MRE.AssetContainer;

	constructor(private appManager: ApplicationManager, private prefab: MRE.Prefab) {
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
			if (prev.state === GAME_STATE.Playing
				&& this.gameSession.state === GAME_STATE.Waiting
				&& this.appManager.getStore().getState().app.displayResults) {
				const playButton = this.playerButtonMapping[prev.selectedDeckId];
				const label = getButtonLabel(playButton);
				const { default: defaultColor } = theme.color.button;
				label.text.contents = "Play";
				label.text.color = defaultColor.text;
				playButton.appearance.material.color = MRE.Color4.FromColor3(defaultColor.background);
			}
		}
	}

	protected createGrowAnimData = (scale: number, distance: number) => {
		return this.assets.createAnimationData(
			// The name is a unique identifier for this data. You can use it to find the data in the asset container,
			// but it's merely descriptive in this sample.
			"Growing",
			{
				// Animation data is defined by a list of animation "tracks": a particular property you want to change,
				// and the values you want to change it to.
				tracks: [{
					// This animation targets the rotation of an actor named "text"
					target: MRE.ActorPath("target").transform.local.scale,
					keyframes: GrowScaleKeyframes(scale),
					easing: MRE.AnimationEaseCurves.EaseOutQuadratic
				}, {
					target: MRE.ActorPath("target").transform.local.rotation,
					keyframes: FlipKeyframes,
					easing: MRE.AnimationEaseCurves.EaseOutQuadratic,
					relative: true
				},
				{
					// This animation targets the rotation of an actor named "text"
					target: MRE.ActorPath("target").transform.local.position,
					keyframes: popKeyframes(distance),
					easing: MRE.AnimationEaseCurves.EaseOutQuadratic,
					relative: true
				}
				]
			});
	}
	protected createShrinkAnimData = (scale: number, distance: number) => {
		return this.assets.createAnimationData(
			// The name is a unique identifier for this data. You can use it to find the data in the asset container,
			// but it's merely descriptive in this sample.
			"Shrinking",
			{
				// Animation data is defined by a list of animation "tracks": a particular property you want to change,
				// and the values you want to change it to.
				tracks: [{
					// This animation targets the rotation of an actor named "text"
					target: MRE.ActorPath("target").transform.local.scale,
					keyframes: ShrinkScaleKeyframes(scale),
					easing: MRE.AnimationEaseCurves.EaseOutQuadratic
				}, {
					target: MRE.ActorPath("target").transform.local.rotation,
					keyframes: FlipKeyframes,
					easing: MRE.AnimationEaseCurves.Linear,
					relative: true
				},
				{
					// This animation targets the rotation of an actor named "text"
					target: MRE.ActorPath("target").transform.local.position,
					keyframes: popKeyframes(distance),
					easing: MRE.AnimationEaseCurves.EaseOutQuadratic,
					relative: true
				}
				]
			});
	}

	private setup = () => {
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
					const GrowAnimData = this.createGrowAnimData(1.5, -0.2)
					const ShrinkAnimData = this.createShrinkAnimData(1.5, 0.2)

					this.deckCards.push(deckCard);
					this.actorDeckMapping[deck.id] = deckCard;
					GrowAnimData.bind(
						{ target: deckCard },
						{ name: "Growing" }
					);
					ShrinkAnimData.bind(
						{ target: deckCard },
						{ name: "Shrinking" }
					);
				}
			}
			this.layoutCards(this.deckCards);
		}
		this.playButtonSoundAsset = this.assets.createSound(
			"final-count-down",
			{ uri: `/sounds/play-button.wav` }
		);
	};

	private layoutCards = (deckCards: Actor[]) => {
		let i = 0;
		const MAX_COL = 5;
		let row = 0;
		this.gridLayout = new MRE.PlanarGridLayout(this.root);
		for (const deckCard of deckCards) {
			if (i % MAX_COL === 0) {
				row++;
			}
			this.gridLayout.addCell({
				row: row,
				height: 0.80,
				column: i % MAX_COL,
				width: 0.56,
				contents: deckCard
			});
			i++;
		}
		this.gridLayout.applyLayout();
		this.backDrop = MRE.Actor.CreateFromPrefab(this.appManager.getContext(),
			{
				prefab: this.prefab,
				actor: {
					parentId: this.root.id,
					transform: {
						local: {
							scale: { x: 1.0, y: (0.31 * row) - 0.02, z: 0.5 }
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
		this.backDrop.collider.onTrigger("trigger-enter", noop);
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
					position: { x: 0, y: 0, z: -0.05 }
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

	private getDeckPrefab = async (deck: Deck, base: MRE.Actor) => {
		const loader = await this.assetContainer.loadGltf(deck.prefabUri, "box");
		const prefab = loader.find(a => a.prefab !== null)?.prefab;
		if (!prefab) {
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
	};

	private getPlayButton = (base: MRE.Actor, deck: Deck) => {
		const mat = this.assets.createMaterial("mat", { color: theme.color.button.default.background });
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
							position: { x: -0.122, y: -0.27, z: 0.0015 },
							rotation: base.transform.local.rotation
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
		playButton.collider.onTrigger("trigger-enter", noop);
		MRE.Actor.Create(this.appManager.getContext(), {
			actor: {
				name: playButtonLabel,
				parentId: playButton.id,
				transform: {
					local: {
						position: { z: 0.005, y: 0 },
						rotation: { y: 45 }
					}
				},
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
		if (this.decksState?.decks) {
			for (const deck of this.decksState.decks) {
				if (deck.enabled) {
					this.attachPlayButtonBehaviors(deck);
					this.attachDeckCardBehaviors(deck);
				}
			}
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
			if (this.gameSession.state === GAME_STATE.Waiting) {
				const lastFlippedCard = this.decksState.decks.find(value => value.flipped);
				const lastFlippedCardId = lastFlippedCard?.id;


				if (lastFlippedCardId) { // Flip the existing card
					this.appManager.getStore().dispatch(setFlipDeck({ id: lastFlippedCardId, flipped: false }));
					const otherCardBase = this.deckCards
						.find(value => `${DECK_CARD_PREFIX}${lastFlippedCard.name}` === value.name);
					// TODO: Kevin to Animate

					otherCardBase.targetingAnimationsByName.get("Growing").stop();
					otherCardBase.targetingAnimationsByName.get("Shrinking").play();
					// otherCardBase.transform.local.scale.x = otherCardBase.transform.local.scale.x / scaleFactor;
					// otherCardBase.transform.local.scale.y = otherCardBase.transform.local.scale.y / scaleFactor;
					// otherCardBase.transform.local.scale.z = otherCardBase.transform.local.scale.z / scaleFactor;
				}
				if (lastFlippedCardId !== deck.id) {
					// TODO: Kevin to Animate
					deckBase.targetingAnimationsByName.get("Shrinking").stop();
					deckBase.targetingAnimationsByName.get("Growing").play();
					// deckBase.targetingAnimationsByName.get("Growing").stop();
					// deckBase.targetingAnimationsByName.get("Shrinking").play();

					this.appManager.getStore().dispatch(setFlipDeck({ id: deck.id, flipped: true }));
				}
			}
		});
	};

	protected attachPlayButtonBehaviors = (deck: Deck) => {
		try {
			const playButton = this.playerButtonMapping[deck.id];
			const label = getButtonLabel(playButton);
			const { disable, default: defaultColor, hover } = theme.color.button;
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
				const flippedCard = this.decksState.decks.find(value => value.flipped);
				if (flippedCard?.id === deck.id) {
					if (this.gameSession.state === GAME_STATE.Playing) {
						// TODO: Prompt to be sure.
						this.appManager.getStore().dispatch(playerDeckCanceled({ playerId: user.id.toString() }));
						label.text.contents = "Play";
					} else {
						this.root.startSound(this.playButtonSoundAsset?.id, { ...config.soundOptions });
						label.text.contents = "Cancel";
						this.appManager.getStore().dispatch(playerDeckSelected({
							selectedDeckId: deck.id,
							playerId: user.id.toString()
						}));
					}
				}
			});
		} catch (error) {
			console.error("Error attaching behaviors for", deck);
		}
	};

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
						position: { x: 0.0, y: -0.1, z: 0.0 }
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

	private createDeck = (deck: Deck) => {
		const base = MRE.Actor.Create(
			this.appManager.getContext(), {
				actor: {
					name: `${DECK_CARD_PREFIX}${deck.name}`,
					parentId: this.root.id,
					transform: { local: { rotation: { y: deck.flipped ? 9 : 0 } } },
					collider: {
						geometry: {
							shape: MRE.ColliderType.Auto
						},
						isTrigger: true
					}
				}
			});
		this.getDeckPrefab(deck, base);
		this.getPlayButton(base, deck);
		return base;
	};
}
