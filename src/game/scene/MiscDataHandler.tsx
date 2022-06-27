import React, {createContext, useEffect, useMemo} from "react"
import {setMiscData, setStartingPosition} from "../state/backend/scene";
import {LgPlayer} from "../player/LgPlayer";

export type MiscData = {
    spawnPoints: [number, number][],
    worldPositions: Record<string, [number, number]>,
}
export const MiscDataHandler: React.FC<{
    data: MiscData,
}> = ({data, children}) => {

    return (
        <>
            {children}
        </>
    )
}
