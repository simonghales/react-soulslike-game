import React, {useCallback, useEffect, useState} from "react"
import {useEffectRef} from "../../../utils/hooks";
import {Tokens, useMobsGroupContext} from "../MobsGroupHandler";
import {useMobBrainContext} from "../mobBrainContext";
import {AttackGoalSubGoal, AttackGoalSubGoalTypes} from "./types";
import {DamageGoalHandler} from "./DamageGoalHandler";
import {lerp} from "three/src/math/MathUtils";

export const useHasBeenGrantedAttackToken = (id: string, grantedAttackTokens: Tokens) => {
    return !!grantedAttackTokens[id]
}

export const CombatHandler: React.FC<{
    subGoal: AttackGoalSubGoal,
    setSubGoal: any,
}> = ({subGoal, setSubGoal}) => {

    const {
        id,
        collisionsState,
    } = useMobBrainContext()

    const {
        requestAttackToken,
        grantedAttackTokens,
    } = useMobsGroupContext()

    const grantedAttackToken = useHasBeenGrantedAttackToken(id, grantedAttackTokens)

    const [hasAttackToken, setHasAttackToken] = useState(grantedAttackToken)

    useEffect(() => {
        if (!grantedAttackToken) {
            return
        }

        const update = () => {
            setHasAttackToken(true)
        }

        update()

        const interval = setInterval(update, 1000)

        return () => {
            clearInterval(interval)
        }

    }, [grantedAttackToken])

    const calculateAttackWeight = useCallback(() => {
        return 1
    }, [])

    const calculateAttackWeightRef = useEffectRef(calculateAttackWeight)

    const [smallRangeAwhile, setSmallRangeAwhile] = useState(false)
    const [mediumRangeAwhile, setMediumRangeAwhile] = useState(false)
    const [largeRangeAwhile, setLargeRangeAwhile] = useState(false)

    const inSmallRange = collisionsState.isInSmallCombatRange
    const inMediumRange = collisionsState.isInMediumCombatRange
    const inLargeRange = collisionsState.isInLargeCombatRange

    useEffect(() => {
        if (inSmallRange) {
            const delay = lerp(500, 750, Math.random())
            const timeout = setTimeout(() => {
                setSmallRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const delay = 200
            const timeout = setTimeout(() => {
                setSmallRangeAwhile(false)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inSmallRange])

    useEffect(() => {
        if (inMediumRange) {
            const delay = lerp(1500, 2500, Math.random())
            const timeout = setTimeout(() => {
                setMediumRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const delay = 500
            const timeout = setTimeout(() => {
                setMediumRangeAwhile(false)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inMediumRange])

    useEffect(() => {
        if (inLargeRange) {
            const delay = lerp(5000, 8000, Math.random())
            const timeout = setTimeout(() => {
                setLargeRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        } else {
            const delay = 1000
            const timeout = setTimeout(() => {
                setLargeRangeAwhile(false)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inLargeRange])

    const [lastAttacked, setLastAttacked] = useState(0)
    const [recentlyAttacked, setRecentlyAttacked] = useState(false)

    const wantsToAttack = (smallRangeAwhile || mediumRangeAwhile || largeRangeAwhile) && !recentlyAttacked

    useEffect(() => {
        if (!wantsToAttack) return
        return requestAttackToken(id, calculateAttackWeightRef)
    }, [wantsToAttack])

    const isAttackingSubGoal = subGoal.type === AttackGoalSubGoalTypes.DAMAGE

    const shouldAttack = !isAttackingSubGoal && hasAttackToken && wantsToAttack

    useEffect(() => {
        if (!shouldAttack) return
        setSubGoal({
            type: AttackGoalSubGoalTypes.DAMAGE,
            time: Date.now()
        })
        setHasAttackToken(false)
    }, [shouldAttack])

    const onAttack = useCallback(() => {
        setLastAttacked(Date.now())
        setRecentlyAttacked(true)
    }, [])

    useEffect(() => {
        if (!lastAttacked) return
        const end = lastAttacked + lerp(1500, 2000, Math.random())
        const delay = end - Date.now()
        const update = () => {
            setRecentlyAttacked(false)
        }
        if (delay <= 0) {
            update()
            return
        }
        const timeout = setTimeout(update, delay)
        return () => {
            clearTimeout(timeout)
        }
    }, [lastAttacked])

    return (
        <>
            {
                isAttackingSubGoal && (
                    <DamageGoalHandler onAttack={onAttack}/>
                )
            }
        </>
    )
}
