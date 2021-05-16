import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import wordwrap from "word-wrap";
import { ApplicationState, Card, GameSession, PlayedCard } from "../models/application";
import { AbstractChangeDetection } from "../store/common/AbstractChangeDetection";
import theme from "../theme/default";

export class GameSessionResults extends AbstractChangeDetection {
	private root: MRE.Actor;
	private gridLayout: MRE.PlanarGridLayout;
	private assets: MRE.AssetContainer;
	private actors: MRE.Actor[] = [];
	constructor(private context: MRE.Context, private parent: MRE.Actor) {
		super();
		this.assets = new MRE.AssetContainer(this.context);
	}

	public setup = () => {
		this.actors = [];
		const mat = this.assets.createMaterial("mat", {color: theme.color.background});
		const box = this.assets.createBoxMesh("box", 1.6, 1.25, 0.075);
		this.root = MRE.Actor.Create(this.context, {
			actor: {
				name: "GameSessionResultsRoot",
				parentId: this.parent.id
			}
		});
		const base = this.createBase();

		const textLayout = new MRE.PlanarGridLayout(base);
		this.getResultsBackground(base, mat, box);
		const title = this.createTitle(base);
		this.actors.push(this.root, base, title);
		let row = 0;
		textLayout.addCell({
			row: row++,
			height: 0.15,
			column: 0,
			width: .45,
			contents:  title,
		});
		for(const card of this.gameSession.draw) {
			const item = this.createResultItem(base, card);
			textLayout.addCell({
				row: row++,
				height: 0.1,
				column: 0,
				width: 2.0,
				contents:  item,
			});
			this.actors.push(item);
		}
		textLayout.applyLayout();
	}

	private getResultsBackground = (base: MRE.Actor, mat: MRE.Material, box: MRE.Mesh) => MRE.Actor.Create(this.context,
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
						position: {x: 0.0, y: -0.2, z: 0.0}
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

	protected createTitle = (base: MRE.Actor) => MRE.Actor.Create(this.context, {
		actor: {
			parentId: base.id,
			name: 'GameResultsTitle',
			appearance: {
				enabled: true
			},
			transform: {
				local: {
					position: { x: 0, y: 0.3, z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: `You got ${this.gameSession?.correctCount} right`,
				height: 0.070,
				anchor: MRE.TextAnchorLocation.BottomCenter,
				justify: MRE.TextJustify.Center,
				color: theme.color.font.header
			}
		}
	});

	protected createResultItem = (base: MRE.Actor, { card, correct }: PlayedCard) => MRE.Actor.Create(this.context, {
		actor: {
			parentId: base.id,
			name: `GameResultItem_${card.id}`,
			appearance: {
				enabled: true
			},
			transform: {
				local: {
					position: {x: 0, y: 0, z: -0.05}
				}
			},
			text: {
				pixelsPerLine: 12,
				contents: wordwrap(`${card.value}`, { width: 140 }),
				height: 0.06,
				anchor: MRE.TextAnchorLocation.MiddleCenter,
				justify: MRE.TextJustify.Center,
				color: correct ? theme.color.font.paragraph : theme.color.font.disabled
			}
		}
	});

	protected createBase = () => MRE.Actor.Create(this.context,
		{
			actor: {
				parentId: this.root.id,
				transform: {
					local: {
						rotation: {x: -0.258819, y: 0, z: 0 },
						position: { x: 0, z: -0.5, y: 1.2	 }
					}
				}
			}
		});

	handleApplicationStateChanged(prev: ApplicationState): void {
		if (prev.displayResults !== this.applicationState.displayResults) {
			if (this.applicationState.displayResults) {
				this.setup();
			} else {
				this.destroy();
			}
		}
	}

	handleGameSessionChanged(prev: GameSession): void {
	}

	public destroy = () => {
		this.actors.forEach(v => v.destroy());
	}
}
