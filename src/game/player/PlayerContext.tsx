import {createContext, useContext} from "react";
import {Body} from "planck";
import {PlayerMovementState} from "./types";

export const PlayerContext = createContext(null! as {
    body: Body,
    combatBody: Body,
    playerDamage: number,
    increasePlayerDamage: (damage: number) => void,
    playerRolled: number,
    setPlayerRolled: any,
    energyUsage: number,
    setEnergyUsage: any,
    increaseEnergyUsage: (amount: number) => void,
    energyLastUsed: number,
    movementState: '' | PlayerMovementState,
    setMovementState: any,
})

export const usePlayerContext = () => {
    return useContext(PlayerContext)
}
