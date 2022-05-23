import {eventEmitter} from "./general";
import {getInteractionEventsKey} from "../data/keys";
import {useEffectRef} from "../../utils/hooks";
import {useEffect} from "react";

export enum InteractionEventType {
    INTERACTION_BEGIN = 'INTERACTION_BEGIN',
    INTERACTION_END = 'INTERACTION_END',
    INTERACTION_INTERRUPTED = 'INTERACTION_INTERRUPTED',
}

export type InteractionEvent = {
    type: InteractionEventType,
    data: any,
}

export const emitInteractionInterrupted = (id: string) => {
    eventEmitter.emit(getInteractionEventsKey(id), {
        type: InteractionEventType.INTERACTION_INTERRUPTED,
        data: {
            time: Date.now(),
        }
    })
}

export const emitInteractionBegan = (id: string) => {
    eventEmitter.emit(getInteractionEventsKey(id), {
        type: InteractionEventType.INTERACTION_BEGIN,
        data: {
            time: Date.now(),
        }
    })
}

export const emitInteractionEnded = (id: string) => {
    eventEmitter.emit(getInteractionEventsKey(id), {
        type: InteractionEventType.INTERACTION_END,
        data: {
            time: Date.now(),
        }
    })
}

export const useOnInteractionEvents = (id: string, callback: (data: InteractionEvent) => void) => {

    const callbackRef = useEffectRef(callback)

    useEffect(() => {

        const onUpdate = (data: any) => {
            callbackRef.current(data)
        }

        eventEmitter.on(getInteractionEventsKey(id), onUpdate)

        return () => {
            eventEmitter.off(getInteractionEventsKey(id), onUpdate)
        }

    }, [id])

}
