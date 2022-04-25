import {Vec2} from "planck";
import {eventEmitter} from "./general";
import {useEffectRef} from "../../utils/hooks";
import {useEffect} from "react";

export enum PlayerEventType {
    DAMAGED = 'DAMAGED',
}

export type PlayerEvent = {
    type: string,
    data?: any,
}

export const emitPlayerDamaged = (id: string, damage: number, currentPosition: Vec2) => {
    eventEmitter.emit(`player`, {
        type: PlayerEventType.DAMAGED,
        data: {
            damage,
            currentPosition,
        }
    })
}

export const useOnPlayerEvents = (id: string, callback: (data: PlayerEvent) => void) => {

    const callbackRef = useEffectRef(callback)

    useEffect(() => {

        const onUpdate = (data: any) => {
            callbackRef.current(data)
        }

        eventEmitter.on(`player`, onUpdate)

        return () => {
            eventEmitter.off(`player`, onUpdate)
        }

    }, [id])

}
