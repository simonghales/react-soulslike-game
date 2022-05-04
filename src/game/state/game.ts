import {proxy, snapshot, subscribe, useSnapshot} from "valtio";
import {useEffect, useState} from "react";

export type MobState = {
    id: string,
    x: number,
    y: number,
    isDead?: boolean,
}

let mobCount = 0

const generateMob = (x: number, y: number) => {
    return {
        id: `basicMob--${mobCount++}`,
        x: x,
        y: y,
    }
}

const generateMobs = () => {

    const mobs: any = {}

    const addMob = (x: number, y: number) => {
        const mob = generateMob(x, y)
        mobs[mob.id] = mob
    }

    addMob(-4, 4)
    // addMob(4, 4)
    // addMob(0, -5)
    // addMob(5, -5)
    // addMob(-5, -5)
    // addMob(5, 5)
    // addMob(-5, 5)
    // addMob(5, 0)
    // addMob(-5, 0)

    return mobs

}

export const gameStateProxy = proxy({
    mobs: generateMobs() as Record<string, MobState>,
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
    const [mobs, setMobs] = useState(snapshot(gameStateProxy.mobs))
    useEffect(() => {
        const unsub = subscribe(gameStateProxy, () => {
            setMobs(snapshot(gameStateProxy.mobs))
        })
        return () => {
            unsub()
        }
    }, [])
    return mobs
}
