import React, {useEffect, useState} from "react"
import {useGoalLimitReset} from "./misc";
import {GoalHandlerProps} from "./GoalHandler";
import {useMobBrainContext} from "../mobBrainContext";
import {getPosition} from "./MoveGoalHandler";
import {Vec2} from "planck";
import {AttackGoalSubGoalTypes} from "./types";
import {useEffectRef} from "../../../utils/hooks";
import {PositionDistance} from "../MobsGroupHandler";

export const FollowGoalHandler: React.FC<GoalHandlerProps> = ({subGoal, setSubGoal}) => {

    useGoalLimitReset(subGoal, setSubGoal, 5)

    const {
        collisionsState,
        targetBodyRef,
        body,
        movementStateRef,
        updateTargetPosition,
        setDebugData,
        setRunning,
        positionToken,
    } = useMobBrainContext()

    const positionTokenRef = useEffectRef(positionToken)

    const [reachedTarget, setReachedTarget] = useState(false)

    useEffect(() => {

        let timeout: any
        let unmounted = false
        let delay = 100

        setRunning(true)
        setReachedTarget(false)

        const update = () => {
            if (unmounted) return
            const targetBody = targetBodyRef.current
            if (!targetBody) return

            const positionToken = positionTokenRef.current

            let idealDistance = 7

            if (positionToken === PositionDistance.CLOSE) {
                idealDistance = 3
            } else if (positionToken === PositionDistance.MEDIUM) {
                idealDistance = 5
            } else if (positionToken === PositionDistance.LONG) {
                idealDistance = 6
            }

            const {
                v2,
                currentDistance,
                difference,
            } = getPosition(body, targetBody, idealDistance, false, true, true, true)

            updateTargetPosition(v2)

            setReachedTarget(currentDistance <= idealDistance + 0.2)

            timeout = setTimeout(update, delay)
        }

        update()

        return () => {
            unmounted = true
            setRunning(false)
            if (timeout) {
                clearTimeout(timeout)
            }
        }

    }, [subGoal])

    useEffect(() => {
        if (!reachedTarget) return
        const timeout = setTimeout(() => {
            updateTargetPosition(null)
            setSubGoal({
                type: AttackGoalSubGoalTypes.IDLE,
                time: performance.now(),
            })
        }, 200)
        return () => {
            clearTimeout(timeout)
        }
    }, [reachedTarget])

    return null
}
