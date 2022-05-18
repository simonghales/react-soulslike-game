import {componentSyncKeys} from "./keys";
import {BasicMob} from "../mobs/frontend/BasicMob";
import {DeadMob} from "../mobs/DeadMob";
import {MobDeadBody} from "../mobs/frontend/MobDeadBody";

export const mainSyncableComponents = {
    [componentSyncKeys.basicMob]: BasicMob,
    [componentSyncKeys.basicMobDead]: MobDeadBody,
}
