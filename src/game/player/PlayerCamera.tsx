import React, {MutableRefObject, useLayoutEffect, useRef} from "react"
import {PerspectiveCamera} from "@react-three/drei";
import {Object3D, Vector3, PerspectiveCamera as PerspectiveCameraImpl} from "three";
import {useFrame} from "@react-three/fiber";
import {usePlayerRef} from "../state/misc";
import {lerp} from "three/src/math/MathUtils";

let playerX = 0
let playerY = 0
let playerVelocityX = 0
let playerVelocityY = 0

let lerpedVelocityX = 0
let lerpedVelocityY = 0

let lerpedX = 0
let lerpedY = 0

export const useCameraController = (groupRef: MutableRefObject<Object3D | undefined>) => {

    const playerRef = usePlayerRef()

    const localStateRef = useRef({
        cameraData: {
            prevPlayerX: 0,
            prevPlayerY: 0,
            prevPlayerVelocityX: 0,
            prevPlayerVelocityY: 0,
        }
    })

    useFrame(() => {

        if (!playerRef || !playerRef.current) return
        if (!groupRef.current) return

        // console.log('position?', playerRef.current.position.x, playerRef.current.position.y)

        playerX = playerRef.current.position.x
        playerY = playerRef.current.position.y

        playerVelocityX = playerX - localStateRef.current.cameraData.prevPlayerX
        playerVelocityY = playerY - localStateRef.current.cameraData.prevPlayerY

        lerpedVelocityX = lerp(localStateRef.current.cameraData.prevPlayerVelocityX, playerVelocityX, 0.5)
        lerpedVelocityY = lerp(localStateRef.current.cameraData.prevPlayerVelocityY, playerVelocityY, 0.5)

        groupRef.current.position.x = lerp(localStateRef.current.cameraData.prevPlayerX + lerpedVelocityX, playerX, 0.5)
        groupRef.current.position.y = lerp(localStateRef.current.cameraData.prevPlayerY + lerpedVelocityY, playerY, 0.5)

        localStateRef.current.cameraData.prevPlayerX = playerX
        localStateRef.current.cameraData.prevPlayerY = playerY
        localStateRef.current.cameraData.prevPlayerVelocityX = playerVelocityX
        localStateRef.current.cameraData.prevPlayerVelocityY = playerVelocityY

    })

}

export const PlayerCamera: React.FC = () => {

    const groupRef = useRef<Object3D>()
    const cameraRef = useRef<PerspectiveCameraImpl>()

    useLayoutEffect(() => {
        if (!cameraRef.current) return
        // cameraRef.current.up = new Vector3(0, 0, -1)
        cameraRef.current.lookAt(new Vector3(0, 0, 0))
    }, [])

    useCameraController(groupRef)

    return (
        <group ref={groupRef}>
            <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 30]} fov={30} />
        </group>
    )
}
