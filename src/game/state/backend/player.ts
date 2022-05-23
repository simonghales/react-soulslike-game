import {proxy, ref, useSnapshot} from "valtio";
import uniqid from 'uniqid';
import {ItemType} from "../../mobs/backend/LgMobDeadBody";

export type PlayerInventoryItem = {
    type: ItemType,
    order: number,
    count: number,
}

const COUNT_LIMIT = 32

export type PlayerInventory = Record<string, PlayerInventoryItem>

export const backendPlayerStateProxy = proxy({
    selectedTarget: '',
    targetItem: '',
    inventory: {
        ['0']: ref({
            type: ItemType.MEDIUM_BRAIN,
            count: 1,
            order: Date.now(),
        }),
        ['1']: ref({
            type: ItemType.MEDIUM_BONES,
            count: 1,
            order: Date.now(),
        }),
    } as PlayerInventory,
})

export const addItemToPlayerInventory = (type: ItemType, count: number) => {

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
            order: Date.now(),
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
