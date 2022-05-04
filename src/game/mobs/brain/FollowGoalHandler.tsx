import React, {useEffect, useState} from "react"
import {useGoalLimitReset} from "./misc";
import {GoalHandlerProps} from "./GoalHandler";
import {useMobBrainContext} from "../mobBrainContext";
import {getPosition} from "./MoveGoalHandler";
import {Vec2} from "planck";
import {AttackGoalSubGoalTypes} from "./types";

export const FollowGoalHandler: React.FC<GoalHandlerProps> = ({subGoal, setSubGoal}) => {

    useGoalLimitReset(subGoal, setSubGoal)

    const {
        collisionsState,
        targetBodyRef,
        body,
        movementStateRef,
        setDebugData,
        setRunning,
    } = useMobBrainContext()

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

            let idealDistance = 3

            const {
                v2,
                currentDistance,
                difference,
            } = getPosition(body, targetBody, idealDistance, false, true, true, true)

            if (!movementStateRef.current.targetPosition) {
                movementStateRef.current.targetPosition = new Vec2(v2)
            } else {
                movementStateRef.current.targetPosition.set(v2)
            }

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
            movementStateRef.current.targetPosition = null
            setSubGoal({
                type: AttackGoalSubGoalTypes.IDLE,
                time: Date.now(),
            })
        }, 200)
        return () => {
            clearTimeout(timeout)
        }
    }, [reachedTarget])

    return null
}
