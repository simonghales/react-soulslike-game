import {createContext, useContext} from "react";

export const PlayerContext = createContext(null! as {
    playerDamage: number,
    increasePlayerDamage: (damage: number) => void,
    playerRolled: number,
    setPlayerRolled: any,
})

export const usePlayerContext = () => {
    return useContext(PlayerContext)
}
