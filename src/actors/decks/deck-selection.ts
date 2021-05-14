import * as MRE from '@microsoft/mixed-reality-extension-sdk';
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
		const box = this.assets.createBoxMesh('box', 0.75, 1, 0.075);
		const textActor = MRE.Actor.Create(this.context, {
			actor: {
				parentId: this.root.id,
				appearance: {
					meshId: box.id,
					materialId: mat.id,
					enabled: true,
				},
				text: {
					pixelsPerLine: 12,
					contents: `${deck.name}\n\n${deck.description}`,
					height: 0.03,
					anchor: MRE.TextAnchorLocation.TopLeft,
					justify: MRE.TextJustify.Left,
					color: MRE.Color3.FromInts(255, 200, 255)
				},
			}
		});
		// textActor.appearance.mesh.boundingBoxDimensions;
		const block = MRE.Actor.Create(this.context,
			{
				actor: {
					parentId: textActor.id,
					appearance: {
						meshId: box.id,
						materialId: mat.id,
						enabled: true,
					},
					transform: {
						local: {
							position: { x:0.375, y: -0.5, z: 0.06},
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
		/*


		 */
		return textActor;
	}
}
