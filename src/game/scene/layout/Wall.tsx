import { Box } from "@react-three/drei"
import React from "react"

export const Wall: React.FC<{
    data: {
        x: number,
        y: number,
        w: number,
        h: number,
    },
    isSensor?: boolean,
}> = ({data, isSensor = false}) => {
    if (isSensor) return null
    return (
        <Box args={[data.w, data.h, isSensor ? 0.1 : 1]} position={[data.x, data.y, 0]}>
            {
                isSensor ? (
                    <meshBasicMaterial color={'purple'} transparent opacity={0.2}/>
                ) : (
                    <meshBasicMaterial color={'black'}/>
                )
            }
        </Box>
    )
}
