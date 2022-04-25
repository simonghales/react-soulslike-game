import {proxy} from "valtio";
import {playerConfig} from "../player/config";

export const playerStateProxy = proxy({
    energyUsage: 0,
    healthRemaining: playerConfig.defaultHealth,
})

export const setPlayerHealthRemaining = (healthRemaining: number) => {
    playerStateProxy.healthRemaining = healthRemaining
}

export const setPlayerEnergyUsage = (energyUsage: number) => {
    playerStateProxy.energyUsage = energyUsage
}
