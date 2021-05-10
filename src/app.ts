/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/**
 * The main class of this Index. All the logic goes here.
 */
export default class App {
  private assets: MRE.AssetContainer;
  private root: MRE.Actor;

  constructor(private context: MRE.Context, private parameterSet: MRE.ParameterSet) {
    this.assets = new MRE.AssetContainer(this.context);
    this.context.onStarted(() => this.started());
    this.context.onUserJoined(user => {
      const redBox = this.getBlock(this.assets.createMaterial('mat', { color: MRE.Color3.Red() }), {
        x: 0, y: 0, z: 1.25
      });
      redBox.attach(user, 'head');
      const blueBox = this.getBlock(this.assets.createMaterial('mat', { color: MRE.Color3.Blue() }), {
        x: 0, y: 1, z: 1
      });
      blueBox.attach(user, 'neck');
    });
  }

  getBlock(mat: MRE.Material, position: Partial<MRE.Vector3Like>) {
    const box = this.assets.createBoxMesh('box', 0.5, 0.5, 0.5);
    const block = MRE.Actor.Create(this.context,
      {
        actor: {
          parentId: this.root.id,
          appearance: {
            meshId: box.id,
            materialId: mat.id,
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
              // size: { x: 0.5, y: 0.5, z: 0.5 }
            },
            isTrigger: true,
          }
        }
      }
    );
    block.collider.onTrigger('trigger-enter', otherActor => {
      console.log("Got a hit from another collider")
    });
    block.collider.onCollision('collision-enter', otherActor => {
      console.log("Got a hit from another collider 2")
    });

    return block;
  }

  private started() {
    this.root = MRE.Actor.Create(this.context, { actor: { name: 'Root' } });

    console.log("App Started");
  }

}
