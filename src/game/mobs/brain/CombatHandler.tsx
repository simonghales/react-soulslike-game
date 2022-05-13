import React, {useCallback, useEffect, useState} from "react"
import {useEffectRef} from "../../../utils/hooks";
import {PositionDistance, Tokens, useMobsGroupContext} from "../MobsGroupHandler";
import {useMobBrainContext} from "../mobBrainContext";
import {AttackGoalSubGoal, AttackGoalSubGoalTypes} from "./types";
import {DamageGoalHandler} from "./DamageGoalHandler";
import {lerp} from "three/src/math/MathUtils";
import {Vec2} from "planck";

const v2 = new Vec2()

export const useHasBeenGrantedAttackToken = (id: string, grantedAttackTokens: Tokens) => {
    return !!grantedAttackTokens[id]
}

export const isMobAllowedClose = (positionToken: string) => {
    return positionToken === PositionDistance.CLOSE
}

export const isMobAllowedMedium = (positionToken: string) => {
    return positionToken === PositionDistance.MEDIUM
}

export const usePresenceState = (considerAttacking: boolean) => {

    const {
        collisionsState,
        positionToken,
    } = useMobBrainContext()

    const [smallRangeAwhile, setSmallRangeAwhile] = useState(false)
    const [mediumRangeAwhile, setMediumRangeAwhile] = useState(false)
    const [largeRangeAwhile, setLargeRangeAwhile] = useState(false)

    const inExtraSmallRange = collisionsState.isInExtraSmallCombatRange
    const inSmallRange = collisionsState.isInSmallCombatRange
    const inMediumRange = collisionsState.isInMediumCombatRange
    const inLargeRange = collisionsState.isInLargeCombatRange

    const isAllowedClose = isMobAllowedClose(positionToken)
    const isAllowedMedium = isMobAllowedMedium(positionToken)

    const inSmallRangeAndAllowedClose = inSmallRange && isAllowedClose
    const inMediumRangeAndAllowedClose = inMediumRange && isAllowedClose
    const inMediumRangeAndAllowedMedium = inMediumRange && isAllowedMedium

    useEffect(() => {
        if (inSmallRangeAndAllowedClose && considerAttacking) {
            const delay = lerp(250, 750, Math.random())
            const timeout = setTimeout(() => {
                setSmallRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inSmallRangeAndAllowedClose, considerAttacking])

    useEffect(() => {
        if (inSmallRange && considerAttacking) {
            const delay = lerp(2000, 4000, Math.random())
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
    }, [inSmallRange, considerAttacking])

    useEffect(() => {
        if (inMediumRangeAndAllowedClose && considerAttacking) {
            const delay = lerp(1500, 7500, Math.random())
            const timeout = setTimeout(() => {
                setMediumRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inMediumRangeAndAllowedClose, considerAttacking])

    useEffect(() => {
        if (inMediumRangeAndAllowedMedium && considerAttacking) {
            const delay = lerp(5000, 10000, Math.random())
            const timeout = setTimeout(() => {
                setMediumRangeAwhile(true)
            }, delay)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [inMediumRangeAndAllowedMedium, considerAttacking])

    useEffect(() => {
        if (inMediumRange && considerAttacking) {
            const delay = lerp(10000, 15000, Math.random())
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
    }, [inMediumRange, considerAttacking])

    useEffect(() => {
        if (inLargeRange && considerAttacking) {
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
    }, [inLargeRange, considerAttacking])

    return {
        inExtraSmallRange,
        smallRangeAwhile,
        setSmallRangeAwhile,
        mediumRangeAwhile,
        setMediumRangeAwhile,
        largeRangeAwhile,
        setLargeRangeAwhile,
    }

}

const CAPPED_DISTANCE = Math.pow(20, 2)

export const CombatHandler: React.FC<{
    subGoal: AttackGoalSubGoal,
    setSubGoal: any,
}> = ({subGoal, setSubGoal}) => {

    const {
        id,
        collisionsState,
        body,
        targetBody,
        damageRecentlyTaken,
        stunned,
    } = useMobBrainContext()

    const {
        requestAttackToken,
        grantedAttackTokens,
        requestPositionToken,
        setHasManualToken,
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

    const [recentlyAttacked, setRecentlyAttacked] = useState(false)

    const calculateAttackWeight = useCallback(() => {
        if (!targetBody) return 1000
        if (recentlyAttacked) return 1000
        const distance = v2.lengthSquared()
        v2.set(body.getPosition())
        v2.sub(targetBody.getPosition())
        return distance
    }, [targetBody, body, recentlyAttacked])

    const calculateAttackWeightRef = useEffectRef(calculateAttackWeight)

    const calculatePositionWeight = useCallback(() => {
        if (!targetBody) return 1000
        const distance = v2.lengthSquared()
        v2.set(body.getPosition())
        v2.sub(targetBody.getPosition())
        return distance
    }, [targetBody, body, recentlyAttacked])

    const calculatePositionWeightRef = useEffectRef(calculatePositionWeight)

    useEffect(() => {
        return requestPositionToken(id, calculatePositionWeightRef)
    }, [])

    const considerAttacking = !recentlyAttacked

    const {
        smallRangeAwhile,
        setSmallRangeAwhile,
        mediumRangeAwhile,
        setMediumRangeAwhile,
        largeRangeAwhile,
        setLargeRangeAwhile,
        inExtraSmallRange,
    } = usePresenceState(considerAttacking)

    const [lastAttacked, setLastAttacked] = useState(0)

    const wantsToAttack = (smallRangeAwhile || mediumRangeAwhile) && !stunned

    useEffect(() => {
        if (!wantsToAttack) return
        return requestAttackToken(id, calculateAttackWeightRef)
    }, [wantsToAttack])

    const isAttackingSubGoal = subGoal.type === AttackGoalSubGoalTypes.DAMAGE

    const manualAttackToken = (inExtraSmallRange || smallRangeAwhile || damageRecentlyTaken) && wantsToAttack

    const shouldAttack = !isAttackingSubGoal && (hasAttackToken || manualAttackToken) && wantsToAttack

    useEffect(() => {
        if (!manualAttackToken) return
        return setHasManualToken(id)
    }, [manualAttackToken])

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
        setLargeRangeAwhile(false)
        setMediumRangeAwhile(false)
        setSmallRangeAwhile(false)
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
