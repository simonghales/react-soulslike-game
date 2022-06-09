import React from "react"
import {Box} from "@react-three/drei";
import {merge} from "lodash"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import { boxLikeAssetConfig } from "@simonghales/react-three-scene-editor";
import {sensorIds} from "../../data/sensors";

export const sensorInputsConfig = merge({
    inputs: {
        sensorId: {
            key: 'sensorId',
            label: 'Sensor Id',
            defaultValue: '',
            options: {
                options: Object.values(sensorIds),
            }
        },
    }
}, boxLikeAssetConfig)

export const Sensor: React.FC = ({
                                     _width = 1,
                                     _depth = 1,
                                    sensorId,
                                     _position,
                                     id,
                                 }: any) => {

    const [x, y] = _position

    console.log('sensorId', sensorId)

    return (
        <>
            <Box args={[_width, _depth, 0.6]} position={[0, 0, 0.3]}>
                <meshBasicMaterial color={"purple"} transparent opacity={0.15}/>
            </Box>
            {/*<SyncComponent id={id} componentId={componentSyncKeys.walkableArea} x={x} y={y} w={_width} h={_depth}/>*/}
        </>
    )
}
