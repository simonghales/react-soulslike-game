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
    sensorPolygonConfig,
    visibilityZoneConfig,
    walkableAreaConfig
} from "../layout/types";
import {VisibilityZone} from "../layout/VisibilityZone";
import {SensorPolygon} from "../layout/SensorPolygon";

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
    ...visibilityZoneConfig,
    component: VisibilityZone,
})

registerAsset({
    ...sensorPolygonConfig,
    component: SensorPolygon,
})

export const AssetsHandler: React.FC = () => {
    return null
}
