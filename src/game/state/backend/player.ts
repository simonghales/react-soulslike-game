import {proxy, ref, useSnapshot} from "valtio";
import uniqid from 'uniqid';
import {ItemType} from "../../data/types";
import {emitPlayerItemReceived} from "../../events/player";
import {useMemo} from "react";

export type PlayerInventoryItem = {
    type: ItemType,
    order: number,
    count: number,
}

const COUNT_LIMIT = 64

export type PlayerInventory = Record<string, PlayerInventoryItem>

export const backendPlayerStateProxy = proxy({
    selectedTarget: '',
    targetItem: '',
    inventory: {
        ['0']: ref({
            type: ItemType.MEDIUM_MEAT,
            count: 1,
            order: performance.now(),
        }),
    } as PlayerInventory,
    collidedSensors: [] as string[],
})

export const useIsPlayerInsideSensor = (id: string) => {

    const collidedSensors = useSnapshot(backendPlayerStateProxy.collidedSensors)

    return collidedSensors.includes(id)

}

export const useIsPlayerInsideSensors = (ids: string[], partialVisibilityZones: string[]) => {

    const collidedSensors = useSnapshot(backendPlayerStateProxy.collidedSensors)

    return useMemo(() => {
        return {
            inside: collidedSensors.some(id => ids.includes(id)),
            partial: collidedSensors.some(id => partialVisibilityZones.includes(id)),
        }
    }, [ids, collidedSensors])

}

export const setPlayerCollidedSensors = (ids: string[]) => {

    backendPlayerStateProxy.collidedSensors.length = 0

    ids.forEach(id => {
        backendPlayerStateProxy.collidedSensors.push(id)
    })

}

export const addItemToPlayerInventory = (type: ItemType, count: number) => {


    emitPlayerItemReceived(type, count)

    const matchedItem = Object.entries(backendPlayerStateProxy.inventory).find(([id, item]) => {
        if (item.type === type) {
            return true
        }
        return false
    })

    let numberToAdd = count

    if (matchedItem) {

        const remainingSpace = COUNT_LIMIT - matchedItem[1].count
        let numberToAddToExisting = remainingSpace

        if (remainingSpace >= numberToAdd) {
            numberToAddToExisting = numberToAdd
            numberToAdd = 0
        } else {
            numberToAdd -= remainingSpace
        }

        if (numberToAddToExisting > 0) {
            backendPlayerStateProxy.inventory[matchedItem[0]] = ref({
                ...matchedItem[1],
                count: matchedItem[1].count + numberToAddToExisting,
            })
        }

    }

    if (numberToAdd > 0) {
        backendPlayerStateProxy.inventory[uniqid()] = ref({
            type,
            count: numberToAdd,
            order: performance.now(),
        })
    }

}

export const setBackendTargetItem = (targetItem: string) => {
    backendPlayerStateProxy.targetItem = targetItem
}

export const setBackendSelectedTarget = (selectedTarget: string) => {
    backendPlayerStateProxy.selectedTarget = selectedTarget
}

export const useIsSelectedTarget = (id: string) => {
    return useSnapshot(backendPlayerStateProxy).selectedTarget === id
}

export const useIsTargetedItem = (id: string) => {
    return useSnapshot(backendPlayerStateProxy).targetItem === id
}
