import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { AlphaMode, BoxAlignment } from "@microsoft/mixed-reality-extension-sdk";
import wordwrap from "word-wrap";
import { ApplicationState, GameSession, PlayedCard } from "../models/application";
import { AbstractChangeDetection } from "../store/common/AbstractChangeDetection";
import theme from "../theme/default";
import delay from "../utils/delay";

const MAX_ITEM_SIZE = 9;
export class GameSessionResults extends AbstractChangeDetection {
	private root: MRE.Actor;
	private assets: MRE.AssetContainer;
	private actors: MRE.Actor[] = [];
	private killed = false;
	private title: MRE.Actor;
	private internalCount = 0;
	private generator = 0;
	private itemCache: MRE.Actor[];

	constructor(private context: MRE.Context, private parent: MRE.Actor) {
		super();
		this.assets = new MRE.AssetContainer(this.context);
	}

	public setup = async () => {
		this.killed = false;
		this.internalCount = 0;
		this.generator = 0;
		this.itemCache = [];
		this.actors = [];
		const mat = this.assets.createMaterial("mat", {color: theme.color.background.default});
		const box = this.assets.createBoxMesh("box", 1.6, 1.25, 0.075);
		this.root = MRE.Actor.Create(this.context, {
			actor: {
				name: "GameSessionResultsRoot",
				parentId: this.parent.id
			}
		});
		const bg = this.getResultsBackground(this.root, mat, box);
		const base = this.createBase(bg);
		this.title = this.createTitle(base);
		this.actors.push(this.root, base, this.title, bg);
		const getTextLayout = () => {
			const layout = new MRE.PlanarGridLayout(base, BoxAlignment.MiddleCenter);
			layout.addCell({
				row: 0,
				height: 0.15,
				column: 0,
				width: 1.6,
				contents: this.title,
				alignment: BoxAlignment.MiddleCenter,
			});
			return layout;
		}
		let textLayout = getTextLayout();

		let row = 0;
		this.fillAndApplyLayout(base, textLayout);
		for (const card of this.gameSession.draw) {
			if (this.killed) { break; }
			this.internalCount += card.correct ? 1 : 0;
			await delay(1000);
			const item = this.createResultItem(base, card);
			row++;
			textLayout.addCell({
				row,
				height: 0.12,
				column: 0,
				width: 1.6,
				contents: item,
			});
			this.itemCache.push(item);
			this.actors.push(item);
			if (this.itemCache.length > MAX_ITEM_SIZE) {
				// Shucks we have work to do
				const anItem = this.itemCache.shift();
				anItem.appearance.enabled = false;
				textLayout = getTextLayout();
				for(let i=0; i < this.itemCache.length; i++) {
					textLayout.addCell({
						row: i + 1,
						height: 0.12,
						column: 0,
						width: 1.6,
						contents: this.itemCache[i],
					})
				}
			}
			this.fillAndApplyLayout(base, textLayout);
			this.title.text.contents = this.getTitleText();
		}
	};

	private fillAndApplyLayout = (base: MRE.Actor, layout: MRE.PlanarGridLayout) => {
		const row = layout.getRowCount();
		if (row <= MAX_ITEM_SIZE) {
			for(let i = row; i <= MAX_ITEM_SIZE; i++) {
				if (this.killed) { break; }
				// eslint-disable-next-line max-len
				const item = this.createResultItem(base, {card: { value: ``, id: `idgen_${this.generator++}`, type: 'text'}, correct: false});
				layout.addCell({
					row: i,
					height: 0.12,
					column: 0,
					width: 1.6,
					contents: item,
					alignment: BoxAlignment.MiddleCenter,
				});
				this.actors.push(item);
			}
		}
		layout.applyLayout();
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
						rotation: {x: -0.258819, y: 0, z: 0},
						position: {x: 0, z: -0.5, y: 1.2}
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

	protected getTitleText = () => `You got ${this.internalCount} right`;
	protected createTitle = (base: MRE.Actor) => MRE.Actor.Create(this.context, {
		actor: {
			parentId: base.id,
			name: "GameResultsTitle",
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
				contents: this.getTitleText(),
				height: 0.070,
				anchor: MRE.TextAnchorLocation.MiddleCenter,
				justify: MRE.TextJustify.Center,
				color: theme.color.font.header
			}
		}
	});

	protected createResultItem = (base: MRE.Actor, {card, correct}: PlayedCard) => MRE.Actor.Create(this.context, {
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
				contents: wordwrap(`${card.value}`, {width: 140}),
				height: 0.065,
				anchor: MRE.TextAnchorLocation.MiddleCenter,
				justify: MRE.TextJustify.Center,
				color: correct ? theme.color.font.paragraph : theme.color.font.disabled
			}
		}
	});

	protected createBase = (parent: MRE.Actor) => {
		const box = this.assets.createBoxMesh('box', 1.6, 1, 0.075);
		const mat = this.assets.createMaterial('transparent', {
			color: MRE.Color4.FromColor3(MRE.Color3.White(), 0),
			alphaMode: AlphaMode.Blend,
		})
		return MRE.Actor.Create(this.context,
			{
				actor: {
					parentId: parent.id,
					appearance: { meshId: box.id, materialId: mat.id },
					transform: {
						local: {
						}
					}
				}
			});
	}

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
		this.killed = true;
		this.actors.forEach(v => v.destroy());
	};
}
