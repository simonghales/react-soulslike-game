import {componentSyncKeys} from "./keys";
import {BasicMob} from "../mobs/frontend/BasicMob";
import {MobDeadBody} from "../mobs/frontend/MobDeadBody";
import {Player} from "../player/Player";

export const mainSyncableComponents = {
    [componentSyncKeys.player]: Player,
    [componentSyncKeys.basicMob]: BasicMob,
    [componentSyncKeys.basicMobDead]: MobDeadBody,
}
