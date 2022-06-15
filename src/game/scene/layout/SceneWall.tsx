import { Box } from "@react-three/drei";
import React from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";

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
