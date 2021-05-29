import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import { AlphaMode } from "@microsoft/mixed-reality-extension-sdk";
import debounce from "lodash.debounce";
import config from "../config";

const showCubes = false;
export class HeadsUpCollisionDetector {
	private assets: MRE.AssetContainer;
	private topDetector: MRE.Actor;
	private bottomDetector: MRE.Actor;
	private frontDetector: MRE.Actor;
	private detecting = false;
	private actors: MRE.Actor[] = [];

	constructor(private context: MRE.Context, private parent: MRE.Actor, private player: MRE.User) {
		this.assets = new MRE.AssetContainer(this.context);
	}

	public startCollectionDetection = (callbackFn: (arg0: 'top'|'bottom') => void) => {
		const callback = debounce(callbackFn, config.headsUpDetectorDebounce, {
			leading: true, trailing: false
		});
		this.detecting = true;
		try {
			this.actors = [];
			const FRONT_DETECTOR = 'frontDetector';
			const mat = this.assets.createMaterial('translucent',
				{ alphaMode: AlphaMode.Blend, color: MRE.Color4.FromColor3(MRE.Color3.White(), 0.1)});
			const headBoxMesh = this.assets.createBoxMesh('box', 0.5, 0.5, 0.5);
			const detectorMesh = this.assets.createBoxMesh('box', 1.5, 0.5, 0.5);

			this.frontDetector =
				this.getDetectableBox(FRONT_DETECTOR, headBoxMesh, {x: 0, y: 0, z: 2.25}, mat);
			this.frontDetector.attach(this.player.id, 'center-eye');

			this.topDetector = this.getDetectableBox('topBoxCollider', detectorMesh, {x: 0, y: 1.25 , z: 2}, mat);
			this.topDetector.attach(this.player.id, 'neck');
			this.topDetector.collider.onTrigger('trigger-enter', (otherActor: MRE.Actor) => {
				if (otherActor.name === FRONT_DETECTOR) { callback('top'); }
				console.log("Top collision")
			});

			this.bottomDetector = this.getDetectableBox('bottomBoxCollider', detectorMesh, {x: 0, y: -1, z: 2}, mat);
			this.bottomDetector.attach(this.player.id, 'neck');
			this.bottomDetector.collider.onTrigger('trigger-enter', (otherActor: MRE.Actor) => {
				if (otherActor.name === FRONT_DETECTOR) { callback('bottom'); }
			});
			this.actors.push(this.topDetector, this.bottomDetector, this.frontDetector);
		} catch (error) {
			this.detecting = false;
			throw error;
		}
	}

	public destroy = () => {
		this.detecting = false;
		this.actors.forEach(v => {
			v.attachment?.userId && v.detach();
			if (v.collider) {
				v.collider.offTrigger('trigger-exit', () => {});
				v.collider.offTrigger('trigger-enter', () => {});
			}
			v.destroy();
		});
	}

	public isDetecting = () => this.detecting;

	public stopCollectionDetection = () => {
		this.destroy();
	}
	
	private getDetectableBox = (
		name: string,
		box: MRE.Mesh,
		position: Partial<MRE.Vector3Like>,
		mat: MRE.Material) => MRE.Actor.Create(this.context,
		{
			actor: {
				parentId: this.parent.id,
				name,
				appearance: {
					meshId: box.id,
					materialId: mat.id,
					enabled: showCubes, // makes invisible. // Use as the debugger.
				},
				transform: {
					local: {
						position,
					}
				},
				rigidBody: {
					isKinematic: true,
					useGravity: false,
					mass: 0.1,
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
