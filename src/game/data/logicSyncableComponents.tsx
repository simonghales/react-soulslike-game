import {componentSyncKeys} from "./keys";
import {LgWall} from "../scene/layout/LgWall";
import {LgWalkableArea} from "../scene/layout/navmesh/LgWalkableArea";

export const logicSyncableComponents = {
    [componentSyncKeys.wall]: LgWall,
    [componentSyncKeys.walkableArea]: LgWalkableArea,
}
