import {boxLikeAssetConfig, registerAsset } from "@simonghales/react-three-scene-editor"
import React from "react"
import {SceneWall} from "../layout/SceneWall";
import {WalkableArea} from "../layout/navmesh/WalkableArea";
import {Sensor, sensorInputsConfig} from "../layout/Sensor";
import {BasicRat, BasicRatPreview, mobInputsConfig} from "../mobs/BasicRat";
import {
    basicRatConfig,
    sceneWallConfig,
    sensorConfig,
    sensorPolygonConfig, spawnPointConfig,
    visibilityZoneConfig,
    walkableAreaConfig
} from "../layout/types";
import {VisibilityZoneAsset, visibilityZoneInputsConfig} from "../layout/VisibilityZone";
import {SensorPolygonAsset, sensorZoneInputsConfig} from "../layout/SensorPolygon";
import {SpawnPointPreview} from "./SpawnPoint";

registerAsset({
    ...boxLikeAssetConfig,
    ...sceneWallConfig,
    component: SceneWall,
})

registerAsset({
    ...boxLikeAssetConfig,
    ...walkableAreaConfig,
    component: WalkableArea,
})

registerAsset({
    ...sensorInputsConfig,
    ...sensorConfig,
    component: Sensor,
})

registerAsset({
    ...mobInputsConfig,
    ...basicRatConfig,
    component: BasicRatPreview,
})

registerAsset({
    ...spawnPointConfig,
    component: SpawnPointPreview,
})

registerAsset({
    ...visibilityZoneInputsConfig,
    ...visibilityZoneConfig,
    component: VisibilityZoneAsset,
})

registerAsset({
    ...sensorZoneInputsConfig,
    ...sensorPolygonConfig,
    component: SensorPolygonAsset,
})

export const AssetsHandler: React.FC = () => {
    return null
}
