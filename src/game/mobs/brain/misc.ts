import {AttackGoalSubGoal, AttackGoalSubGoalTypes} from "./types";
import {useEffect} from "react";

export const useGoalLimitReset = (subGoal: AttackGoalSubGoal, setSubGoal: any) => {
    useEffect(() => {
        const {
            time,
        } = subGoal

        const timeLimit = (time + (20 * 1000)) - Date.now()

        const timeout = setTimeout(() => {
            setSubGoal({
                type: AttackGoalSubGoalTypes.IDLE,
                time: Date.now(),
            })
        }, timeLimit)

        return () => {
            clearTimeout(timeout)
        }

    }, [subGoal])
}
