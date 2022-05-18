import {Box, useTexture} from "@react-three/drei"
import React, {Suspense, useLayoutEffect, useRef} from "react"
import {Object3D} from "three";
import {usePhysicsRef} from "@simonghales/react-three-physics";

const Visuals: React.FC = () => {
    const texture = useTexture("assets/mob-dead.png")
    return (
        <sprite scale={[1.5, 1.5, 1.5]} position={[0.125, 0, 0.05]}>
            <spriteMaterial map={texture} depthWrite={false} depthTest={false}/>
        </sprite>
    )
}

export const MobDeadBody: React.FC<{
    id: string,
    x: number,
    y: number
}> = ({id, x, y}) => {

    const ref = usePhysicsRef(id)

    useLayoutEffect(() => {
        const group = ref.current
        if (!group) return
        group.position.x = x
        group.position.y = y
    }, [])

    return (
        <group ref={ref}>
            <Suspense fallback={null}>
                <Visuals/>
            </Suspense>
        </group>
    )
}
