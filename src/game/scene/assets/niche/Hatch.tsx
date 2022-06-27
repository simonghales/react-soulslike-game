import React from "react"
import {Circle} from "@react-three/drei";

export const Hatch: React.FC<{
    isTarget: boolean,
    activated: boolean,
    position: [number, number],
}> = ({position, activated, isTarget}) => {
    return (
        <Circle args={[0.5]} position={[position[0], position[1], 0]}>
            <meshBasicMaterial color={activated ? isTarget ? 'red' : 'green' : 'purple'} transparent opacity={0.5} depthTest={false} depthWrite={false}/>
        </Circle>
    )
}
