import React from "react"
import {Plane} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";

export const Scenery: React.FC = () => {
    return (
        <>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <Plane args={[256, 256]}>
                <meshBasicMaterial color={'grey'}/>
            </Plane>
            <gridHelper args={[256, 256]} rotation={[degToRad(90), 0, 0]}/>
        </>
    )
}
