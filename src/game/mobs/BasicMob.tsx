import React from "react"
import {Cylinder} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {usePhysicsRef} from "react-three-physics";

export const BasicMob: React.FC<{
    id: string,
}> = ({id}) => {

    const ref = usePhysicsRef(id)

    return (
        <group ref={ref}>
            <Cylinder args={[0.5, 0.5, 1.5, 16]}
                      position={[0, 0, 0.75]}
                      rotation={[degToRad(90), 0, 0]}>
                <meshBasicMaterial color={'purple'}/>
            </Cylinder>
        </group>
    )
}
