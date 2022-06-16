import {Vec2} from "planck";
import {eventEmitter} from "./general";
import {useEffectRef} from "../../utils/hooks";
import {useEffect} from "react";
import {ItemType} from "../data/types";
import {eventKeys} from "../data/keys";

export enum PlayerEventType {
    DAMAGED = 'DAMAGED',
    CARVING_BEGAN = 'CARVING_BEGAN',
    CARVING_END = 'CARVING_END',
    INTERACTION_END = 'INTERACTION_END',
    ITEM_RECEIVED = 'ITEM_RECEIVED',
}

export type PlayerBaseEvent = {
    type: PlayerEventType,
}

export type PlayerDamagedEvent = PlayerBaseEvent & {
    damage: number,
    x: number,
    y: number,
}

export type PlayerEvent = {
    type: string,
    data?: any,
}

export const emitPlayerCarvingBegan = (id: string, time: number) => {
    eventEmitter.emit(`player`, {
        type: PlayerEventType.CARVING_BEGAN,
        data: {
            id,
            time,
        }
    })
}

export const emitPlayerCarvingEnd = (id: string, time: number) => {
    eventEmitter.emit(`player`, {
        type: PlayerEventType.CARVING_END,
        data: {
            id,
            time,
        }
    })
}

export const emitPlayerInteractionEnd = (id: string, time: number) => {
    eventEmitter.emit(`player`, {
        type: PlayerEventType.INTERACTION_END,
        data: {
            id,
            time,
        }
    })
}

export const emitPlayerItemReceived = (type: ItemType, count: number) => {
    eventEmitter.emit(`player`, {
        type: PlayerEventType.ITEM_RECEIVED,
        data: {
            type,
            count,
            time: performance.now(),
        }
    })
}

export const emitPlayerInventoryItemReceived = (type: ItemType, count: number) => {
    eventEmitter.emit(eventKeys.playerInventory, {
        type: PlayerEventType.ITEM_RECEIVED,
        data: {
            type,
            count,
            time: performance.now(),
        }
    })
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
