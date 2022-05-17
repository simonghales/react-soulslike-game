import {createContext, useContext} from "react";

export const LgMobContext = createContext(null! as {
    damageTaken: number,
    damageRecentlyTaken: boolean,
    onDamage: any,
    stunned: boolean,
    isAlive: boolean,
    healthRemaining: number,
    onDeath: any,
    setReady: any,
})

export const useLgMobContext = () => {
    return useContext(LgMobContext)
}
