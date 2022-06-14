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
import {VisibilityZoneAsset, visibilityZoneInputsConfig} from "../layout/VisibilityZone";
import {SensorPolygonAsset, sensorZoneInputsConfig} from "../layout/SensorPolygon";

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
