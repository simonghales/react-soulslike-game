import {proxy, snapshot, subscribe, useSnapshot} from "valtio";
import {useEffect, useState} from "react";

export type MobState = {
    id: string,
    x: number,
    y: number,
    isDead?: boolean,
}

export type DeadBody = {
    id: string,
    x: number,
    y: number,
}

let mobCount = 0

const generateMob = (x: number, y: number) => {
    return {
        id: `basicMob--${mobCount++}`,
        x: x,
        y: y,
    }
}

const generateDeadBody = (id: string, x: number, y: number): DeadBody => {

    return {
        id: `${id}--dead`,
        x,
        y,
    }

}

const generateMobs = () => {

    const mobs: any = {}

    const addMob = (x: number, y: number) => {
        const mob = generateMob(x, y)
        mobs[mob.id] = mob
    }

    addMob(-4, 6)
    addMob(4, 6)
    addMob(0, 7)
    // addMob(5, 7)
    // addMob(-5, 7)
    addMob(8, 7)
    addMob(-8, 7)
    // addMob(5, 3)
    // addMob(-5, 3)

    return mobs

}

export const gameStateProxy = proxy({
    mobs: generateMobs() as Record<string, MobState>,
    deadBodies: {} as Record<string, DeadBody>,
})

export const setMobDead = (id: string) => {
    gameStateProxy.mobs = {
        ...gameStateProxy.mobs,
        [id]: {
            ...gameStateProxy.mobs[id],
            isDead: true,
        }
    }
}

export const useMobs = () => {

    return useSnapshot(gameStateProxy.mobs)

}

export const useDeadBodies = () => {

    return useSnapshot(gameStateProxy.deadBodies)

}

export const addDeadBody = (id: string, x: number, y: number) => {
    const deadBody = generateDeadBody(id, x, y)
    gameStateProxy.deadBodies[deadBody.id] = deadBody
}
