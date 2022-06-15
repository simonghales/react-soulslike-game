import {createContext, useContext} from "react";

export const GameContext = createContext(null! as {
    isPlayMode: boolean,
})

export const useIsPlayMode = () => {
    return useContext(GameContext).isPlayMode
}
