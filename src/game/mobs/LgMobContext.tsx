import {createContext, useContext} from "react";
import {MobType} from "../state/game";

export const LgMobContext = createContext(null! as {
    damageTaken: number,
    damageRecentlyTaken: boolean,
    onDamage: any,
    stunned: boolean,
    isAlive: boolean,
    healthRemaining: number,
    onDeath: any,
    setReady: any,
    type: MobType,
})

export const useLgMobContext = () => {
    return useContext(LgMobContext)
}
