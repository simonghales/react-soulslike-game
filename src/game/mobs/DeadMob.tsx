import React from "react"
import {Sphere} from "@react-three/drei";
import {usePhysicsRef} from "@simonghales/react-three-physics";

export const DeadMob: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    return (
        <>
            <group position={[x, y, 0.1]}>
                <Sphere args={[0.45]}>
                    <meshBasicMaterial color={'black'} transparent opacity={0.5}/>
                </Sphere>
            </group>
        </>
    )
}
