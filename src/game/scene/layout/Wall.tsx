import {Box} from "@react-three/drei"
import React from "react"
import {WallCondition} from "./LgWall";

export const Wall: React.FC<{
    data: {
        x: number,
        y: number,
        w: number,
        h: number,
    },
    isSensor?: boolean,
    breakable: boolean,
    unlockable: boolean,
    wallState: WallCondition,
}> = ({data, isSensor = false, breakable, unlockable, wallState}) => {
    if (isSensor) return null

    const damaged = wallState === WallCondition.DAMAGED

    return (
        <Box args={[data.w, data.h, isSensor ? 0.1 : 1]} position={[data.x, data.y, damaged ? -0.5 : 0]}>
            {
                isSensor ? (
                    <meshBasicMaterial color={'purple'} transparent opacity={0.2}/>
                ) : (
                    <meshBasicMaterial color={breakable ? damaged ? 'orangered' : 'orange' : unlockable ? 'purple' : 'black'}/>
                )
            }
        </Box>
    )
}
