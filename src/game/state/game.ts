import {proxy, snapshot, subscribe, useSnapshot} from "valtio";
import {useEffect, useState} from "react";

export type MobState = {
    id: string,
    x: number,
    y: number,
    isDead?: boolean,
}

export const gameStateProxy = proxy({
    mobs: {
        ['basicMob--0']: {
            id: 'basicMob--0',
            x: -2,
            y: 2,
        },
        ['basicMob--1']: {
            id: 'basicMob--1',
            x: 2,
            y: 2,
        },
        ['basicMob--2']: {
            id: 'basicMob--2',
            x: 0,
            y: -5,
        },
    } as Record<string, MobState>,
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
