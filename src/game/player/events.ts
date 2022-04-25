import {PlayerEventType, useOnPlayerEvents} from "../events/player";
import {useCallback, useEffect, useMemo, useState} from "react";
import {usePlayerContext} from "./PlayerContext";
import {useEffectRef} from "../../utils/hooks";

export const useEventsHandler = () => {

    const {
        increasePlayerDamage,
        playerRolled,
    } = usePlayerContext()

    const [invincible, setInvincible] = useState(false)

    const invincibleRef = useEffectRef(invincible)

    useEffect(() => {

        const now = Date.now()
        const timeRemaining = (playerRolled + 275) - now
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

        const handleDamaged = (damage: number) => {
            if (invincibleRef.current) {
                console.log('ignore damage...')
            } else {
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
                actions.handleDamaged(event.data.damage)
                break;
        }
    }, [actions]))

}
