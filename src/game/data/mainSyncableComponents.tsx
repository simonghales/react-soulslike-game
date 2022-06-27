import {componentSyncKeys} from "./keys";
import {BasicMob} from "../mobs/frontend/BasicMob";
import {MobDeadBody} from "../mobs/frontend/MobDeadBody";
import {Player} from "../player/Player";
import {Wall} from "../scene/layout/Wall";
import {VisibilityZone} from "../scene/layout/VisibilityZone";
import {InteractionTrigger} from "../scene/assets/InteractionTrigger";
import {ActiveDialogue} from "../scene/dialogue/ActiveDialogue";
import {CollectableItem} from "../scene/items/CollectableItem";
import {Hatch} from "../scene/assets/niche/Hatch";

export const mainSyncableComponents = {
    [componentSyncKeys.wall]: Wall,
    [componentSyncKeys.player]: Player,
    [componentSyncKeys.basicMob]: BasicMob,
    [componentSyncKeys.basicMobDead]: MobDeadBody,
    [componentSyncKeys.visibilityZone]: VisibilityZone,
    [componentSyncKeys.interactionTrigger]: InteractionTrigger,
    [componentSyncKeys.activeDialogue]: ActiveDialogue,
    [componentSyncKeys.item]: CollectableItem,
    [componentSyncKeys.hatch]: Hatch,
}
