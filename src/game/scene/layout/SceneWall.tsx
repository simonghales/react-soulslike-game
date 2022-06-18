import { Box } from "@react-three/drei";
import React from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import {merge} from "lodash";
import {sensorIds} from "../../data/sensors";
import {boxLikeAssetConfig} from "@simonghales/react-three-scene-editor";
import {BreakableWallStrength, GameWorldStateIds} from "../../data/ids";

export const wallInputsConfig = merge({
    inputs: {
        breakable: {
            key: 'breakable',
            label: 'Breakable',
            defaultValue: false,
        },
        breakableHealth: {
            key: 'breakableHealth',
            label: 'Breakable Health',
            defaultValue: BreakableWallStrength.DEFAULT,
            options: {
                options: Object.keys(BreakableWallStrength),
            },
        },
        onDestroyKey: {
            key: 'onDestroyKey',
            label: 'On Destroy Key',
            defaultValue: '',
            options: {
                options: ['', ...Object.keys(GameWorldStateIds)],
            }
        },
        removeOnStateFlag: {
            key: 'removeOnStateFlag',
            label: 'Remove On State Flag',
            defaultValue: '',
            options: {
                options: ['', ...Object.keys(GameWorldStateIds)],
            },
        }
    }
}, boxLikeAssetConfig)

export const SceneWall: React.FC = ({
                                           _width = 1,
                                           _depth = 1,
    _position,
                                            id,
                                       }: any) => {


    const [x, y] = _position

    return (
        <>
            <Box args={[_width, _depth, 0.5]} position={[0, 0, 0.25]}>
                <meshBasicMaterial color={"black"}/>
            </Box>
            {/*<SyncComponent id={id} componentId={componentSyncKeys.wall} x={x} y={y} w={_width} h={_depth}/>*/}
        </>
    )
}
