import React, {MutableRefObject, useEffect, useLayoutEffect, useRef, useState} from "react"
import {PerspectiveCamera} from "@react-three/drei";
import {Object3D, Vector3, PerspectiveCamera as PerspectiveCameraImpl} from "three";
import {useFrame} from "@react-three/fiber";
import {usePlayerRef} from "../state/misc";
import {lerp} from "three/src/math/MathUtils";
import {useTargetRef} from "../state/frontend/player";
import {normalize} from "../../utils/numbers";
import {easeInOutCubic, easeInOutSine, easeInQuart} from "../../utils/easing";

let playerX = 0
let playerY = 0
let playerVelocityX = 0
let playerVelocityY = 0

let lerpedVelocityX = 0
let lerpedVelocityY = 0

let lerpedX = 0
let lerpedY = 0
let lerpAmount = 0
let targetLerpAmount = 0
let timeElapsed = 0
let progress = 0
let targetX = 0
let targetY = 0

const calculateTargetLerpAmount = (time: number) => {
    timeElapsed = Date.now() - time
    progress = normalize(timeElapsed, 350, 0)
    progress = easeInOutSine(progress)
    return progress * 0.5
}

const calculateTargetUnlockedLerpAmount = (time: number) => {
    timeElapsed = Date.now() - time
    progress = normalize(timeElapsed, 300, 50)
    progress = 1 - progress
    progress = easeInOutSine(progress)
    return progress * 0.5
}

const calculateTargetSwitchLerpAmount = (time: number) => {
    timeElapsed = Date.now() - time
    progress = normalize(timeElapsed, 200, 0)
    progress = easeInOutCubic(progress)
    return progress
}

export const useCameraController = (groupRef: MutableRefObject<Object3D | undefined>) => {

    const playerRef = usePlayerRef()

    const targetRef = useTargetRef()

    const localStateRef = useRef({
        cameraData: {
            prevPlayerX: 0,
            prevPlayerY: 0,
            prevPlayerVelocityX: 0,
            prevPlayerVelocityY: 0,
            targetLocked: 0,
            targetChanged: 0,
            targetUnlocked: 0,
            latestTargetPosition: {
                x: 0,
                y: 0,
            },
            previousTargetPosition: {
                x: 0,
                y: 0,
            }
        }
    })

    const hasTarget = !!targetRef

    const [recentlyHasLocked, setRecentlyHasLocked] = useState(hasTarget)

    useEffect(() => {
        if (hasTarget) {
            setRecentlyHasLocked(true)
        } else {
            const timeout = setTimeout(() => {
                setRecentlyHasLocked(false)
            }, 100)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [hasTarget])

    useEffect(() => {
        if (recentlyHasLocked) {
            localStateRef.current.cameraData.targetLocked = Date.now()
        }
    }, [recentlyHasLocked])

    useEffect(() => {
        if (targetRef) {
            localStateRef.current.cameraData.targetChanged = Date.now()
            return () => {
                localStateRef.current.cameraData.targetUnlocked = Date.now()
                localStateRef.current.cameraData.previousTargetPosition.x = targetRef.current ? targetRef.current.position.x : localStateRef.current.cameraData.latestTargetPosition.x
                localStateRef.current.cameraData.previousTargetPosition.y = targetRef.current ? targetRef.current.position.y : localStateRef.current.cameraData.latestTargetPosition.y
            }
        }
    }, [targetRef])

    useFrame(() => {

        if (!playerRef || !playerRef.current) return
        if (!groupRef.current) return

        playerX = playerRef.current.position.x
        playerY = playerRef.current.position.y

        playerVelocityX = playerX - localStateRef.current.cameraData.prevPlayerX
        playerVelocityY = playerY - localStateRef.current.cameraData.prevPlayerY

        lerpedVelocityX = lerp(localStateRef.current.cameraData.prevPlayerVelocityX, playerVelocityX, 0.5)
        lerpedVelocityY = lerp(localStateRef.current.cameraData.prevPlayerVelocityY, playerVelocityY, 0.5)

        lerpedX = lerp(localStateRef.current.cameraData.prevPlayerX + lerpedVelocityX, playerX, 0.5)
        lerpedY = lerp(localStateRef.current.cameraData.prevPlayerY + lerpedVelocityY, playerY, 0.5)

        if (targetRef) {
            lerpAmount = calculateTargetLerpAmount(localStateRef.current.cameraData.targetLocked)

            targetX = targetRef.current ? targetRef.current.position.x : localStateRef.current.cameraData.latestTargetPosition.x
            targetY = targetRef.current ? targetRef.current.position.y : localStateRef.current.cameraData.latestTargetPosition.y

            if (localStateRef.current.cameraData.targetChanged) {

                targetLerpAmount = calculateTargetSwitchLerpAmount(localStateRef.current.cameraData.targetChanged)
                targetX = lerp(localStateRef.current.cameraData.previousTargetPosition.x, targetX, targetLerpAmount)
                targetY = lerp(localStateRef.current.cameraData.previousTargetPosition.y, targetY, targetLerpAmount)

            }

            targetX = lerp(localStateRef.current.cameraData.latestTargetPosition.x, targetX, 0.5)
            targetY = lerp(localStateRef.current.cameraData.latestTargetPosition.y, targetY, 0.5)

            lerpedX = lerp(lerpedX, targetX, lerpAmount)
            lerpedY = lerp(lerpedY, targetY, lerpAmount)

            localStateRef.current.cameraData.latestTargetPosition.x = targetX
            localStateRef.current.cameraData.latestTargetPosition.y = targetY

        } else if (localStateRef.current.cameraData.targetUnlocked) {
            lerpAmount = calculateTargetUnlockedLerpAmount(localStateRef.current.cameraData.targetUnlocked)
            lerpedX = lerp(lerpedX, localStateRef.current.cameraData.previousTargetPosition.x, lerpAmount)
            lerpedY = lerp(lerpedY, localStateRef.current.cameraData.previousTargetPosition.y, lerpAmount)
        }

        groupRef.current.position.x = lerpedX
        groupRef.current.position.y = lerpedY

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
