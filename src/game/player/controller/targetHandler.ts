import {useEffect, useMemo, useRef, useState} from "react";
import {usePlayerContext} from "../PlayerContext";
import {PlayerCollisionsData} from "./collisionsHandler";
import {PlayerRangeCollisionTypes} from "../../data/collisions";
import {Body, Vec2} from "planck";
import {MovementState, PlayerState} from "./types";
import {KeysProcessedState} from "../keys";
import {angleToV2, getAngleBetweenAngles, v2ToAngle} from "../../../utils/angles";
import {lerp, radToDeg} from "three/src/math/MathUtils";
import {useEffectRef} from "../../../utils/hooks";
import {getMobTargetPriorityMultiplier} from "../../data/mobs";

const v2 = new Vec2()
const direction = new Vec2()
let moveX = 0
let moveY = 0
let wantsToMove = false
let directionAngle = 0
let enemyDirection = 0
let angleDifference = 0
let lastSelected = 0
let timeSinceSelected = 0
let now = 0
let extraPenalty = 0

export type RecentlySelected = Record<string, number>

export type SelectedTargetWithBody = {id: string, body: Body}

export type SelectedTarget = null | SelectedTargetWithBody

const selectIdealTarget = (
    collisions: PlayerCollisionsData,
    body: Body,
    movementState: MovementState,
    keysState: KeysProcessedState,
    playerState: PlayerState,
    recentlySelected: RecentlySelected,
    selectedTarget: SelectedTarget,
    favourDistance: boolean = false,
) => {

    const enemiesInRange = collisions[PlayerRangeCollisionTypes.PLAYER_LARGE_COMBAT_RANGE] ?? {}

    if (Object.keys(enemiesInRange).length === 0) return null

    moveX = keysState.moveRightHeld ? 1 : keysState.moveLeftHeld ? -1 : 0
    moveY = keysState.moveUpHeld ? 1 : keysState.moveDownHeld ? -1 : 0

    wantsToMove = moveX !== 0 || moveY !== 0


    if (wantsToMove) {
        direction.set(moveX, moveY).normalize()
    } else {
        angleToV2(movementState.previousMovementDirection, direction)
    }

    v2.set(body.getPosition())
    directionAngle = v2ToAngle(direction.x, direction.y)

    const enemyCalculations: Record<string, {
        angleDifference: number,
        squaredDistance: number,
        extraPenalty: number,
        targetMultiplier: number,
    }> = {}

    now = Date.now()

    Object.entries(enemiesInRange).forEach(([id, targetBody]) => {

        direction.set(targetBody.getPosition())
        direction.sub(v2)
        enemyDirection = v2ToAngle(direction.x, direction.y)
        angleDifference = Math.abs(getAngleBetweenAngles(radToDeg(directionAngle), radToDeg(enemyDirection)))
        extraPenalty = 0

        if (!wantsToMove) {
            lastSelected = recentlySelected[id] ?? 0
            if (lastSelected) {
                timeSinceSelected = now - lastSelected
                if (timeSinceSelected < 2000) {
                    const diff = 2000 - timeSinceSelected
                    extraPenalty += diff
                }
            }
        }

        if (selectedTarget?.id === id) {
            extraPenalty += 2000
        }

        enemyCalculations[id] = {
            angleDifference: Math.pow(angleDifference, favourDistance ? 0.5 : 0.9),
            squaredDistance: direction.lengthSquared(),
            extraPenalty,
            targetMultiplier: getMobTargetPriorityMultiplier((targetBody.getUserData() as any).mobType ?? ''),
        }
    })

    const sortedEnemies = Object.entries(enemyCalculations).sort(([idA, dataA], [idB, dataB]) => {
        return ((dataA.angleDifference + dataA.squaredDistance + dataA.extraPenalty) * dataA.targetMultiplier) - ((dataB.angleDifference + dataB.squaredDistance + dataB.extraPenalty) * dataB.targetMultiplier)
    })

    const target = {
        id: sortedEnemies[0][0],
        body: enemiesInRange[sortedEnemies[0][0]],
    }

    return target
}

export const useTargetControls = (
    movementState: MovementState,
    keysState: KeysProcessedState,
    playerState: PlayerState,
) => {

    const [isInTargetMode, setIsInTargetMode] = useState(false)

    const {
        collisions,
        collisionsRef,
        body,
        selectedTarget,
        setSelectedTarget,
    } = usePlayerContext()

    const localStateRef = useRef({
        recentlySelected: {} as Record<string, number>,
    })

    const recentlySelected = localStateRef.current.recentlySelected

    const selectedTargetRef = useEffectRef(selectedTarget)

    useEffect(() => {
        localStateRef.current.recentlySelected = {}
    }, [isInTargetMode])

    const controls = useMemo(() => {


        return {
            selectIdealTarget: (favourDistance: boolean = false) => {
                const selectedTarget = selectedTargetRef.current
                const collisions = collisionsRef.current
                const target = selectIdealTarget(collisions, body, movementState, keysState, playerState, recentlySelected, selectedTarget, favourDistance)
                setSelectedTarget(target)
                if (target) {
                    recentlySelected[target.id] = Date.now()
                }
                return target
            },
            clearTarget: () => {
              setSelectedTarget(null)
            },
        }
    }, [])

    useEffect(() => {
        if (!selectedTarget) return

        const enemiesInRange = collisions[PlayerRangeCollisionTypes.PLAYER_LARGE_COMBAT_RANGE] ?? {}

        if (!enemiesInRange[selectedTarget.id]) {
            const newTarget = controls.selectIdealTarget(true)
            if (!newTarget) {
                controls.clearTarget()
            }
        }

    }, [selectedTarget, collisions])

    return {
        controls,
        selectedTarget,
        selectedTargetRef,
        isInTargetMode,
        setIsInTargetMode,
    }

}
