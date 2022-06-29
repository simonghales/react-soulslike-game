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
import {AiCharacter} from "../scene/assets/niche/AiCharacter";
import {SceneTextures} from "../scene/assets/niche/SceneTextures";
import {VisibilityPolygon} from "../scene/assets/niche/VisibilityPolygon";

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
    [componentSyncKeys.aiCharacter]: AiCharacter,
    [componentSyncKeys.sceneTextures]: SceneTextures,
    [componentSyncKeys.visibilityPolygon]: VisibilityPolygon,
}
