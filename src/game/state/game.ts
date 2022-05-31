import {proxy, snapshot, subscribe, useSnapshot} from "valtio";
import {useEffect, useState} from "react";

export enum MobType {
    BASIC = 'BASIC',
    LARGE = 'LARGE',
}

export type MobState = {
    id: string,
    x: number,
    y: number,
    type: MobType,
    isDead?: boolean,
}

export type DeadBody = {
    id: string,
    x: number,
    y: number,
    type: MobType,
}

let mobCount = 0

const generateMob = (x: number, y: number, mobType: MobType, id?: string): MobState => {
    return {
        id: `basicMob--${mobCount++}-${id ?? ''}`,
        x: x,
        y: y,
        type: mobType,
    }
}

const generateDeadBody = (id: string, x: number, y: number, mobType: MobType): DeadBody => {

    return {
        id: `${id}--dead`,
        x,
        y,
        type: mobType,
    }

}

const generateMobs = (): Record<string, MobState> => {

    const mobs: Record<string, MobState> = {}

    const addMob = (x: number, y: number, mobType: MobType = MobType.BASIC, id?: string) => {
        const mob = generateMob(x, y, mobType, id)
        mobs[mob.id] = mob
    }

    addMob(-4, 6)
    addMob(4, 6)
    addMob(0, 10, MobType.LARGE, 'large')
    addMob(8, 7)
    addMob(-8, 7)



    // addMob(5, 3)
    // addMob(-5, 3)
    // addMob(5, 7)
    // addMob(-5, 7)

    return mobs

}

export const gameStateProxy = proxy({
    mobs: generateMobs() as Record<string, MobState>,
    deadBodies: {} as Record<string, DeadBody>,
})

export const useMobs = () => {

    return useSnapshot(gameStateProxy.mobs)

}

export const useDeadBodies = () => {

    return useSnapshot(gameStateProxy.deadBodies)

}

export const addDeadBody = (id: string, x: number, y: number, mobType: MobType) => {
    const deadBody = generateDeadBody(id, x, y, mobType)
    gameStateProxy.deadBodies[deadBody.id] = deadBody
}

export const removeDeadBody = (id: string) => {
    delete gameStateProxy.deadBodies[id]
}
