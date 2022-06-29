import React, {MutableRefObject, useEffect, useLayoutEffect, useRef, useState} from "react"
import {PerspectiveCamera} from "@react-three/drei";
import {Object3D, Vector3, PerspectiveCamera as PerspectiveCameraImpl} from "three";
import {useFrame} from "@react-three/fiber";
import {usePlayerRef} from "../state/misc";
import {lerp} from "three/src/math/MathUtils";
import {playerMiscProxy, RecentHitData, useTargetRef} from "../state/frontend/player";
import {normalize} from "../../utils/numbers";
import {easeInOutCubic, easeInOutSine, easeInQuad, easeInQuart, easeInSine} from "../../utils/easing";
import {useSnapshot} from "valtio";
import {Vec2} from "planck";

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
    timeElapsed = performance.now() - time
    progress = normalize(timeElapsed, 400, 0)
    progress = easeInOutSine(progress)
    return progress * 0.5
}

const calculateTargetUnlockedLerpAmount = (time: number) => {
    timeElapsed = performance.now() - time
    progress = normalize(timeElapsed, 350, 50)
    progress = 1 - progress
    progress = easeInOutSine(progress)
    return progress * 0.5
}

const calculateTargetSwitchLerpAmount = (time: number) => {
    timeElapsed = performance.now() - time
    progress = normalize(timeElapsed, 300, 0)
    progress = easeInOutCubic(progress)
    return progress
}

type ImpactVelocity = {
    x: number,
    y: number,
}

const impactVelocity: ImpactVelocity = {
    x: 0,
    y: 0,
}

const offsetV2 = new Vec2()
const v2 = new Vec2()
const hitV2 = new Vec2()
let now = 0
let HIT_MAX_AGE = 550
let hitTimeElapsed = 0
let hitProgress = 0
let hitMultiplier = 0
let cameraVelocityX = 0
let cameraVelocityY = 0
let xDiff = 0
let yDiff = 0
let movingWeight = 0
let amount = 0

const addRecentHitsImpact = (recentHits: RecentHitData[], impactVelocity: ImpactVelocity, previousImpactVelocity: ImpactVelocity) => {

    now = performance.now()

    v2.set(0, 0)

    recentHits.forEach(([xVel, yVel, time], index) => {
        hitTimeElapsed = now - time
        if (hitTimeElapsed > HIT_MAX_AGE) {
            recentHits.splice(index, 1)
        }
        hitProgress = normalize(hitTimeElapsed, HIT_MAX_AGE, 0)
        hitProgress = easeInOutCubic(hitProgress)
        hitV2.set(xVel, yVel)
        hitMultiplier = lerp(0.15, 0, hitProgress)
        hitV2.mul(hitMultiplier)
        v2.add(hitV2)
    })

    v2.clamp(2)

    impactVelocity.x = lerp(v2.x, previousImpactVelocity.x, 0.75)
    impactVelocity.y = lerp(v2.y, previousImpactVelocity.y, 0.75)

    return impactVelocity

}

let focusWeight = 0
const FOCUS_CHANGE_DURATION = 750

const calculateFocusWeight = (startTime: number) => {
    now = performance.now()
    timeElapsed = now - startTime
    progress = normalize(timeElapsed, FOCUS_CHANGE_DURATION, 0)
    return easeInQuad(progress)
}

export const useCameraController = (
    groupRef: MutableRefObject<Object3D | undefined>,
    x: number,
    y: number,
    focusPointPosition?: [number, number],
    ) => {

    const recentHits = useSnapshot(playerMiscProxy).recentHits

    const playerRef = usePlayerRef()

    const targetRef = useTargetRef()

    const localStateRef = useRef({
        cameraData: {
            prevPlayerX: x,
            prevPlayerY: y,
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
            },
            previousImpactVelocity: {
                x: 0,
                y: 0,
            },
            offsetX: 0,
            offsetY: 0,
            cameraVelocityX: 0,
            cameraVelocityY: 0,
            targetCameraVelocityX: 0,
            targetCameraVelocityY: 0,
            previousCameraVelocityX: 0,
            previousCameraVelocityY: 0,
            cameraOffsetChanged: 0,
            cameraOffsetCharge: 0,
            isMovingWeight: 0,
        }
    })

    const [focusState] = useState({
        noFocus: 0,
        focusStart: 0,
        focusChanged: 0,
        previousFocusLost: 0,
        previousX: 0,
        previousY: 0,
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        prevX: 0,
        prevY: 0,
    })

    useEffect(() => {
        if (focusPointPosition) {
            if (!focusState.focusStart) {
                focusState.focusStart = performance.now()
            }
            if (!focusState.noFocus && !focusState.focusChanged) {
                focusState.currentX = groupRef?.current?.position?.x ?? 0
                focusState.currentY = groupRef?.current?.position?.y ?? 0
                console.log('set to group position?')
            }
            focusState.focusChanged = performance.now()
            focusState.targetX = focusPointPosition[0]
            focusState.targetY = focusPointPosition[1]
            return () => {
                focusState.previousFocusLost = performance.now()
            }
        } else {
            focusState.focusStart = 0
            focusState.focusChanged = 0
            if (!focusState.previousFocusLost) return
            focusState.noFocus = performance.now()
        }
    }, [focusPointPosition])

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
            localStateRef.current.cameraData.targetLocked = performance.now()
        }
    }, [recentlyHasLocked])

    useEffect(() => {
        if (targetRef) {
            localStateRef.current.cameraData.targetChanged = performance.now()
            return () => {
                localStateRef.current.cameraData.targetUnlocked = performance.now()
                localStateRef.current.cameraData.previousTargetPosition.x = targetRef.current ? targetRef.current.position.x : localStateRef.current.cameraData.latestTargetPosition.x
                localStateRef.current.cameraData.previousTargetPosition.y = targetRef.current ? targetRef.current.position.y : localStateRef.current.cameraData.latestTargetPosition.y
            }
        }
    }, [targetRef])

    useFrame((state, delta) => {

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
        } else {

            if (focusPointPosition) {
                focusWeight = calculateFocusWeight(focusState.focusChanged)
                focusState.currentX = lerp(focusState.currentX, focusState.targetX, focusWeight)
                focusState.currentY = lerp(focusState.currentY, focusState.targetY, focusWeight)
                focusWeight = calculateFocusWeight(focusState.focusStart)
                lerpedX = lerp(lerpedX, focusState.currentX, focusWeight)
                lerpedY = lerp(lerpedY, focusState.currentY, focusWeight)
                focusState.prevX = lerpedX
                focusState.prevY = lerpedY
            } else {
                if (focusState.noFocus) {
                    focusWeight = calculateFocusWeight(focusState.noFocus)
                    if (focusWeight >= 1) {
                        focusState.noFocus = 0
                    }
                    focusState.currentX = lerp(focusState.prevX, lerpedX, focusWeight)
                    focusState.currentY = lerp(focusState.prevY, lerpedY, focusWeight)
                    lerpedX = lerp(focusState.currentX, lerpedX, focusWeight)
                    lerpedY = lerp(focusState.currentY, lerpedY, focusWeight)
                }
            }

            /*

            if current focus point, update focus weight

             */

        }


        // else if (focusPointPosition) {
        //
        //     if (focusState.previousFocusLost) {
        //         focusWeight = calculateFocusWeight(focusState.previousFocusLost)
        //         if (focusWeight >= 1) {
        //             focusState.previousFocusLost = 0
        //         }
        //         lerpedX = lerp(focusState.previousX, lerpedX, focusWeight)
        //         lerpedY = lerp(focusState.previousY, lerpedY, focusWeight)
        //     }
        //
        //     focusWeight = calculateFocusWeight(focusState.focusChanged)
        //     lerpedX = lerp(lerpedX, focusPointPosition[0], focusWeight)
        //     lerpedY = lerp(lerpedY, focusPointPosition[1], focusWeight)
        //     focusState.previousX = lerpedX
        //     focusState.previousY = lerpedY
        // }

        if (recentHits.length) {
            addRecentHitsImpact(recentHits as RecentHitData[], impactVelocity, localStateRef.current.cameraData.previousImpactVelocity)
            if (impactVelocity.x !== 0 || impactVelocity.y !== 0) {

                localStateRef.current.cameraData.previousImpactVelocity.x = impactVelocity.x
                localStateRef.current.cameraData.previousImpactVelocity.y = impactVelocity.y

                lerpedX += impactVelocity.x
                lerpedY += impactVelocity.y
            }
        } else {
            localStateRef.current.cameraData.previousImpactVelocity.x = 0
            localStateRef.current.cameraData.previousImpactVelocity.y = 0
        }

        if (playerVelocityX !== 0 || playerVelocityY !== 0) {

            offsetV2.set(playerVelocityX, playerVelocityY)
            offsetV2.normalize()

            localStateRef.current.cameraData.offsetX = lerp(localStateRef.current.cameraData.offsetX, offsetV2.x, 0.0275)
            localStateRef.current.cameraData.offsetY = lerp(localStateRef.current.cameraData.offsetY, offsetV2.y, 0.0275)

            if (localStateRef.current.cameraData.isMovingWeight < 10) {
                localStateRef.current.cameraData.isMovingWeight += 10 * delta
                if (localStateRef.current.cameraData.isMovingWeight > 10) {
                    localStateRef.current.cameraData.isMovingWeight = 10
                }
            }

        } else {

            if (localStateRef.current.cameraData.isMovingWeight > 0) {
                localStateRef.current.cameraData.isMovingWeight = lerp(localStateRef.current.cameraData.isMovingWeight, 0, 0.33)
                localStateRef.current.cameraData.isMovingWeight -= 2 * delta
                if (localStateRef.current.cameraData.isMovingWeight < 0) {
                    localStateRef.current.cameraData.isMovingWeight = 0
                }
            } else {
                localStateRef.current.cameraData.targetCameraVelocityX = localStateRef.current.cameraData.cameraVelocityX
                localStateRef.current.cameraData.targetCameraVelocityY = localStateRef.current.cameraData.cameraVelocityY
            }

        }

        offsetV2.set(localStateRef.current.cameraData.offsetX, localStateRef.current.cameraData.offsetY)

        if (offsetV2.lengthSquared() >= 0.95) {
            offsetV2.normalize()
            xDiff = Math.abs(offsetV2.x - localStateRef.current.cameraData.targetCameraVelocityX)
            yDiff = Math.abs(offsetV2.y - localStateRef.current.cameraData.targetCameraVelocityY)
            if (xDiff >= 0.075 || yDiff >= 0.075) {
                localStateRef.current.cameraData.previousCameraVelocityX = localStateRef.current.cameraData.cameraVelocityX
                localStateRef.current.cameraData.previousCameraVelocityY = localStateRef.current.cameraData.cameraVelocityY
                localStateRef.current.cameraData.targetCameraVelocityX = offsetV2.x
                localStateRef.current.cameraData.targetCameraVelocityY = offsetV2.y
                localStateRef.current.cameraData.cameraOffsetChanged = performance.now()
                localStateRef.current.cameraData.cameraOffsetCharge = 20
            }

        }

        movingWeight = normalize(localStateRef.current.cameraData.isMovingWeight, 10, 0)

        // todo - account for movingWeight

        if (localStateRef.current.cameraData.cameraOffsetCharge) {
            amount = movingWeight * 5 * delta
            localStateRef.current.cameraData.cameraOffsetCharge -= amount
            progress = 1 - normalize(localStateRef.current.cameraData.cameraOffsetCharge, 20, 0)
            progress = easeInSine(progress)
            localStateRef.current.cameraData.cameraVelocityX = lerp(localStateRef.current.cameraData.previousCameraVelocityX, localStateRef.current.cameraData.targetCameraVelocityX, progress)
            localStateRef.current.cameraData.cameraVelocityY = lerp(localStateRef.current.cameraData.previousCameraVelocityY, localStateRef.current.cameraData.targetCameraVelocityY, progress)
        }

        // if (localStateRef.current.cameraData.cameraOffsetChanged) {
        //     timeElapsed = performance.now() - localStateRef.current.cameraData.cameraOffsetChanged
        //     progress = normalize(timeElapsed, 3000, 0)
        //     if (progress >= 1) {
        //         localStateRef.current.cameraData.cameraOffsetChanged = 0
        //     }
        //     progress = easeInSine(progress)
        //     localStateRef.current.cameraData.cameraVelocityX = lerp(localStateRef.current.cameraData.previousCameraVelocityX, localStateRef.current.cameraData.targetCameraVelocityX, progress)
        //     localStateRef.current.cameraData.cameraVelocityY = lerp(localStateRef.current.cameraData.previousCameraVelocityY, localStateRef.current.cameraData.targetCameraVelocityY, progress)
        // }


        cameraVelocityX = localStateRef.current.cameraData.cameraVelocityX * 1.75
        cameraVelocityY = localStateRef.current.cameraData.cameraVelocityY * 1.75

        // lerpedX += cameraVelocityX
        // lerpedY += cameraVelocityY

        groupRef.current.position.x = lerpedX
        groupRef.current.position.y = lerpedY

        localStateRef.current.cameraData.prevPlayerX = playerX
        localStateRef.current.cameraData.prevPlayerY = playerY
        localStateRef.current.cameraData.prevPlayerVelocityX = playerVelocityX
        localStateRef.current.cameraData.prevPlayerVelocityY = playerVelocityY

    })

}

export const PlayerCamera: React.FC<{
    x: number,
    y: number,
    focusPointPosition?: [number, number],
}> = ({x, y, focusPointPosition}) => {

    const groupRef = useRef<Object3D>()
    const cameraRef = useRef<PerspectiveCameraImpl>()

    useLayoutEffect(() => {
        const object = groupRef.current
        if (!object) return
        object.position.x = x
        object.position.y = y
    }, [])

    useLayoutEffect(() => {
        if (!cameraRef.current) return
        // cameraRef.current.up = new Vector3(0, 0, -1)
        cameraRef.current.lookAt(new Vector3(x, y, 0))
    }, [])

    useCameraController(groupRef, x, y, focusPointPosition)

    return (
        <group ref={groupRef as any}>
            <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 30]} fov={30} />
        </group>
    )
}

// 30
