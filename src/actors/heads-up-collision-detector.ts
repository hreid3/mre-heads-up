import * as MRE from "@microsoft/mixed-reality-extension-sdk";

export class HeadsUpCollisionDetector {
	private assets: MRE.AssetContainer;
	private topDetector: MRE.Actor;
	private bottomDetector: MRE.Actor;
	private frontDetector: MRE.Actor;
	private actors: MRE.Actor[] = [];

	constructor(private context: MRE.Context, private parent: MRE.Actor, private player: MRE.User) {
		this.assets = new MRE.AssetContainer(this.context);
	}

	public startCollectionDetection = (callback: (arg0: 'top'|'bottom') => void) => {
		this.actors = [];
		const FRONT_DETECTOR = 'frontDetector';
		const headBoxMesh = this.assets.createBoxMesh('box', 0.5, 0.5, 0.5);
		const detectorMesh = this.assets.createBoxMesh('box', 1.5, 0.5, 0.5);

		this.frontDetector =
			this.getDetectableBox(FRONT_DETECTOR, headBoxMesh, { x: 0, y: 0, z: 1.25 });
		this.frontDetector.attach(this.player.id, 'head');

		this.topDetector = this.getDetectableBox('topBoxCollider', detectorMesh, {x: 0, y: 1, z: 1});
		this.topDetector.attach(this.player.id, 'neck');
		this.topDetector.collider.onTrigger('trigger-enter', (otherActor: MRE.Actor) => {
			if (otherActor.name === FRONT_DETECTOR) {
				callback('top');
				console.log("TopBox connected");
			}
		});

		this.bottomDetector = this.getDetectableBox('bottomBoxCollider', detectorMesh, {x: 0, y: -1, z: 1});
		this.bottomDetector.attach(this.player.id, 'neck');
		this.bottomDetector.collider.onTrigger('trigger-enter', (otherActor: MRE.Actor) => {
			if (otherActor.name === FRONT_DETECTOR) {
				callback('bottom');
				console.log("bottomBox connected");
			}
		});
		this.actors.push(this.topDetector, this.bottomDetector, this.frontDetector);
	}

	public destroy = () => {
		this.actors.forEach(v => v.destroy());
	}

	public stopCollectionDetection = () => {
		this.destroy();
	}
	
	private getDetectableBox = (
		name: string,
		box: MRE.Mesh,
		position: Partial<MRE.Vector3Like>) => MRE.Actor.Create(this.context,
		{
			actor: {
				parentId: this.parent.id,
				name,
				appearance: {
					meshId: box.id,
					enabled: false, // makes invisible. // Use as the debugger.
				},
				transform: {
					local: {
						position,
					}
				},
				rigidBody: {
					isKinematic: true,
				},
				collider: {
					geometry: {
						shape: MRE.ColliderType.Auto,
					},
					isTrigger: true,
				}
			}
		}
	);
}
