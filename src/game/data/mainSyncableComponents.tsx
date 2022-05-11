import {componentSyncKeys} from "./keys";
import {BasicMob} from "../mobs/BasicMob";
import {DeadMob} from "../mobs/DeadMob";

export const mainSyncableComponents = {
    [componentSyncKeys.basicMob]: BasicMob,
    [componentSyncKeys.basicMobDead]: DeadMob,
}
