import React, {createContext, useContext} from "react"
import {World} from "planck";

const Context = createContext<{
    world: World,
}>(null!)

export const useWorld = () => {
    return useContext(Context).world
}

export const WorldProvider: React.FC<{
    world: World,
}> = ({world, children}) => {
    return (
        <Context.Provider value={{
            world,
        }}>
            {children}
        </Context.Provider>
    )
}
