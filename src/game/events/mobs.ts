import {eventEmitter} from "./general";
import {useEffectRef} from "../../utils/hooks";
import {useEffect} from "react";
import {Vec2} from "planck";

export enum MobEventType {
    DAMAGED = 'DAMAGED',
}

export type MobEvent = {
    type: string,
    data?: any,
}

export const emitMobDamaged = (id: string, damage: number, currentPosition: Vec2) => {
    eventEmitter.emit(`mob--${id}`, {
        type: MobEventType.DAMAGED,
        data: {
            damage,
            currentPosition,
        }
    })
}

export const useOnMobEvents = (id: string, callback: (data: MobEvent) => void) => {

    const callbackRef = useEffectRef(callback)

    useEffect(() => {

        const onUpdate = (data: any) => {
            callbackRef.current(data)
        }

        eventEmitter.on(`mob--${id}`, onUpdate)

        return () => {
            eventEmitter.off(`mob--${id}`, onUpdate)
        }

    }, [id])

}
