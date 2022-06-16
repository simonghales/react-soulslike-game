import { Circle } from "@react-three/drei"
import React from "react"

export const SpawnPointPreview: React.FC = () => {
    return (
        <Circle>
            <meshBasicMaterial color={'blue'} transparent opacity={0.5}/>
        </Circle>
    )
}
