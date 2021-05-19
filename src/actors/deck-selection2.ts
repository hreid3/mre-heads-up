import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { Actor } from "@microsoft/mixed-reality-extension-sdk";
import wordwrap from "word-wrap";
import { Deck } from "../models/application";
import theme from "../theme/default";
import config from "../config";

const playButtonName = "playButton";
const playButtonLabel = "label";

export class DeckSelection {
	private gridLayout: MRE.PlanarGridLayout;
	// private decksState: DecksState;
	private assets: MRE.AssetContainer;
	private actorDeckMapping: Record<string, Actor> = {};
	public playerButtonMapping: Record<string, Actor> = {};
	// private gameSession: GameSession;
	private deckCards: Actor[] = [];
	private playButtonSoundAsset: MRE.Asset;

	constructor(private context: MRE.Context, private root: MRE.Actor, private decks: Deck[]) {
		this.assets = new MRE.AssetContainer(this.context);
		this.setup();
	}

	private setup = () => {
		console.log("Decks change detected");
		if (this.decks) {
			for (const deck of this.decks) {
				if (deck.enabled) {
					const deckCard = this.createDeck(deck);
					this.deckCards.push(deckCard);
					this.actorDeckMapping[deck.id] = deckCard;
				}
			}
			this.layoutCards(this.deckCards);
		}

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
	private getDeckTitle = (deck: Deck, base: MRE.Actor, box: MRE.Mesh, mat: MRE.Material) => MRE.Actor.Create(this.context, {
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
	private getDeckDesc = (deck: Deck, base: MRE.Actor, box: MRE.Mesh, mat: MRE.Material) => MRE.Actor.Create(this.context, {
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

	// Todo: This qualifies for a Atomic Component
	private getPlayButton = (base: MRE.Actor, deck: Deck) => {
		const mat = this.assets.createMaterial("mat", {color: theme.color.button.default.background});
		const box = this.assets.createBoxMesh("box", 0.3, 0.1, 0.05);
		const playButton = MRE.Actor.Create(this.context,
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
							position: {x: 0.0, y: -0.50, z: -0.05}
						}
					},
					rigidBody: {
						isKinematic: true,
						useGravity: false,
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

		const label = MRE.Actor.Create(this.context, {
			actor: {
				name: playButtonLabel,
				parentId: playButton.id,
				transform: {local: {position: {z: -0.03, y: 0.005}}},
				text: {
					contents: "Play",
					pixelsPerLine: 12,
					height: 0.06,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: theme.color.button.default.text
				}
			}
		});
		this.playerButtonMapping[deck.id] = playButton;
		return playButton;
	};

	private getDeckBackground = (base: MRE.Actor, mat: MRE.Material, box: MRE.Mesh) => MRE.Actor.Create(this.context,
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
		const base = MRE.Actor.Create(this.context, {actor: {parentId: this.root.id}});
		this.getDeckBackground(base, mat, box);
		const title = this.getDeckTitle(deck, base, box, mat);
		const description = this.getDeckDesc(deck, base, box, mat);
		this.getPlayButton(base, deck);
		const textLayout = new MRE.PlanarGridLayout(base);
		textLayout.addCell({
			row: 0,
			height: 0.0,
			column: 0,
			width: .45,
			contents: title
		});

		textLayout.addCell({
			row: 1,
			height: 0.4,
			column: 0,
			width: .45,
			contents: description
		});
		textLayout.applyLayout();
		return base;
	};
}
