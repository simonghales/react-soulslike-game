import React, {Suspense, useEffect, useLayoutEffect} from "react"
import {Plane, useTexture} from "@react-three/drei";
import {degToRad} from "three/src/math/MathUtils";
import {RepeatWrapping} from "three";
import {NavMeshGuide} from "./scene/layout/navmesh/NavMeshGuide";

const size = 256
const texture_size = 256
// const repeat = size / texture_size
const repeat = size / 4

const Floor: React.FC = () => {

    const texture = useTexture("assets/floor.png")

    useLayoutEffect(() => {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(repeat, repeat);
        texture.offset.set(0, 0);
    }, [texture])

    return (
        <Plane args={[size, size]} position={[0, 0, -0.01]}>
            <meshBasicMaterial map={texture}/>
        </Plane>
    )
}

export const Scenery: React.FC = () => {
    return (
        <>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <Suspense fallback={null}>
                <Floor/>
            </Suspense>
            {/*<gridHelper args={[256, 256]} rotation={[degToRad(90), 0, 0]}/>*/}
            {/*<NavMeshGuide/>*/}
        </>
    )
}
