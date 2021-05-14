import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import wordwrap from 'word-wrap';
import { Deck, DecksState } from "../../models/application";
import store from "../../store";

export class DeckSelection {
	private root: MRE.Actor
	private gridLayout: MRE.PlanarGridLayout;
	private decksState: DecksState = null;
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context, private parent: MRE.Actor) {
		this.assets = new MRE.AssetContainer(this.context);
		this.setup();
		this.detectChanges();
	}

	public destroy = () => {
		this.root?.destroy();
	}

	private detectChanges = () => {
		store.subscribe(() => {
			const decks = store.getState().decks;
			if (this.decksState !== decks) {
				this.decksState = decks;
				this.destroy();
				this.setup();
			}
		});
	}

	private setup = () => {
		this.root = MRE.Actor.Create(this.context, {
			actor: {
				name: 'DeckSelectionRoot',
				parentId: this.parent.id,
			}
		});
		let i = 0;
		this.gridLayout = new MRE.PlanarGridLayout(this.root);
		if (this.decksState?.decks) {
			console.log("Horace", "Decks change detected");
			for(const deck of this.decksState.decks) {
				const deckCard = this.createDeck(deck);
				this.gridLayout.addCell({
					row: 0,
					height: 1,
					column: i++,
					width: .45,
					contents: deckCard,
				})
			}
			this.gridLayout.applyLayout();
			// Create the front of the card with behaviors to boot
		}
	}

	private createDeck = (deck: Deck) => {
		const mat = this.assets.createMaterial('mat', { color: MRE.Color3.Blue() });
		const box = this.assets.createBoxMesh('box', 0.8, 1, 0.075);
		const base = MRE.Actor.Create(this.context, {
			actor: {
				parentId: this.root.id,
			}
		})
		const block = MRE.Actor.Create(this.context,
			{
				actor: {
					parentId: base.id,
					appearance: {
						meshId: box.id,
						materialId: mat.id,
						enabled: true,
					},
					transform: {
						local: {
							position: { x:0.020, y: -0.1, z: 0.0},
						}
					},
					// rigidBody: {
					// 	isKinematic: true,
					// },
					collider: {
						geometry: {
							shape: MRE.ColliderType.Auto,
							// size: { x: 0.5, y: 0.5, z: 0.5 }
						},
						isTrigger: true,
					}
				}
			}
		);
		const textLayout = new MRE.PlanarGridLayout(base);
		const title = MRE.Actor.Create(this.context, {
			actor: {
				parentId: base.id,
				appearance: {
					meshId: box.id,
					materialId: mat.id,
					enabled: true,
				},
				transform: {
					local: {
						position: { x: 0, y: 0, z: -0.05},
					}
				},
				text: {
					pixelsPerLine: 12,
					contents: `${wordwrap(deck.name)}`,
					height: 0.070,
					anchor: MRE.TextAnchorLocation.BottomCenter,
					justify: MRE.TextJustify.Center,
					color: MRE.Color3.FromInts(255, 200, 255)
				},
			}
		});
		textLayout.addCell({
			row: 0,
			height: 0.0,
			column: 0,
			width: .45,
			contents: title
		})

		const description = MRE.Actor.Create(this.context, {
			actor: {
				parentId: base.id,
				appearance: {
					meshId: box.id,
					materialId: mat.id,
					enabled: true,
				},
				transform: {
					local: {
						position: { x: 0, y: 0, z: -0.05},
					}
				},
				text: {
					pixelsPerLine: 12,
					contents: `${wordwrap(deck.description, { width: 40})}`,
					height: 0.035,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					justify: MRE.TextJustify.Center,
					color: MRE.Color3.FromInts(255, 200, 255)
				},
			}
		});
		textLayout.addCell({
			row: 1,
			height: 0.4,
			column: 0,
			width: .45,
			contents: description
		})
		textLayout.applyLayout();
		// textActor.appearance.mesh.boundingBoxDimensions;
		return base;
	}


}
