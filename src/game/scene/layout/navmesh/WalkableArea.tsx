import React from "react"
import {Box} from "@react-three/drei";
import {componentSyncKeys} from "../../../data/keys";
import {SyncComponent} from "@simonghales/react-three-physics";

export const WalkableArea: React.FC = ({
                                           _width = 1,
                                           _depth = 1,
                                           _position,
                                           id,
                                       }: any) => {

    const [x, y] = _position

    return (
        <>
            <Box args={[_width, _depth, 0.5]} position={[0, 0, 0.25]}>
                <meshBasicMaterial color={"orange"} transparent opacity={0.15}/>
            </Box>
            {/*<SyncComponent id={id} componentId={componentSyncKeys.walkableArea} x={x} y={y} w={_width} h={_depth}/>*/}
        </>
    )
}
