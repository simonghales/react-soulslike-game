import {createContext, MutableRefObject, useContext} from "react";
import {Body} from "planck";
import {PlayerCollisionsState, PlayerFixtures, PlayerMovementState} from "./types";
import {PlayerCollisionsData} from "./controller/collisionsHandler";
import {SelectedTarget} from "./controller/targetHandler";

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
    fixtures: PlayerFixtures,
    collisionsState: PlayerCollisionsState,
    collisionsStateRef: MutableRefObject<PlayerCollisionsState>,
    collisions: PlayerCollisionsData,
    collisionsRef: MutableRefObject<PlayerCollisionsData>,
    selectedTarget: SelectedTarget,
    setSelectedTarget: any,
})

export const usePlayerContext = () => {
    return useContext(PlayerContext)
}
