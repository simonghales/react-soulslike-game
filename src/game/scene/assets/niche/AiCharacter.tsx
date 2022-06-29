import React, { Suspense } from "react"
import {Box, useTexture} from "@react-three/drei";

const Visuals: React.FC = () => {

    const texture = useTexture("/assets/sprites/ai-monitor.png")

    return (
        <>
            <sprite scale={[3, 3, 3]} position={[0, 0, 0.0002]}>
                <spriteMaterial map={texture} depthWrite={false} depthTest={false}/>
            </sprite>
        </>
    )

}

export const AiCharacter: React.FC<{
    position: [number, number],
}> = ({position}) => {
    return (
        <group position={[position[0], position[1], 0]}>
            <Suspense fallback={null}>
                <Visuals/>
            </Suspense>
        </group>
    )
}
