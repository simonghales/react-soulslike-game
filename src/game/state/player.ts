import {proxy} from "valtio";

export const playerStateProxy = proxy({
    energyUsage: 0,
})

export const setPlayerEnergyUsage = (energyUsage: number) => {
    playerStateProxy.energyUsage = energyUsage
}
