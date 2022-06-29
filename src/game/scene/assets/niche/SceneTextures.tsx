import React, { Suspense } from "react"
import {useTexture} from "@react-three/drei";

const scaleAmount = 14
const scale = [scaleAmount * 1.77, scaleAmount, scaleAmount] as [number, number, number]

const Visuals: React.FC = () => {
    const texture = useTexture("/assets/sprites/lv0.png")

    return (
        <>
            <sprite scale={scale} position={[-2, 2.5, 0.0001]}>
                <spriteMaterial map={texture} depthWrite={false} depthTest={false}/>
            </sprite>
        </>
    )
}

export const SceneTextures: React.FC = () => {
    return (
        <Suspense fallback={null}>
            <Visuals/>
        </Suspense>
    )
}
