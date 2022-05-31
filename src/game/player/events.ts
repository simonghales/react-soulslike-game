import {PlayerEventType, useOnPlayerEvents} from "../events/player";
import {useCallback, useEffect, useMemo, useState} from "react";
import {usePlayerContext} from "./PlayerContext";
import {useEffectRef} from "../../utils/hooks";
import {Vec2} from "planck";

const v2 = new Vec2()
const emptyV2 = new Vec2()

export const useEventsHandler = () => {

    const {
        increasePlayerDamage,
        playerRolled,
        body,
    } = usePlayerContext()

    const [invincible, setInvincible] = useState(false)

    const invincibleRef = useEffectRef(invincible)

    useEffect(() => {

        const now = performance.now()
        const timeRemaining = (playerRolled + 300) - now
        const isRecent = now >= playerRolled && timeRemaining > 0

        if (isRecent) {

            setInvincible(true)

            const timeout = setTimeout(() => {
                setInvincible(false)
            }, timeRemaining)

            return () => {
                clearTimeout(timeout)
            }

        } else {
            setInvincible(false)
        }

    }, [playerRolled])

    const actions = useMemo(() => {

        const handleDamaged = (damage: number, currentPosition: Vec2) => {
            if (invincibleRef.current) {
                return
            } else {
                v2.set(body.getPosition())
                v2.sub(currentPosition)
                v2.normalize()
                v2.mul(2)
                body.applyLinearImpulse(v2, emptyV2)
                increasePlayerDamage(damage)
            }
        }

        return {
            handleDamaged,
        }

    }, [increasePlayerDamage])

    useOnPlayerEvents('', useCallback((event) => {
        switch (event.type) {
            case PlayerEventType.DAMAGED:
                actions.handleDamaged(event.data.damage, event.data.currentPosition)
                break;
        }
    }, [actions]))

}
