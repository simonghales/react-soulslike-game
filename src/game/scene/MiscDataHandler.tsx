import React, {createContext, useEffect, useMemo} from "react"
import {setMiscData, setStartingPosition} from "../state/backend/scene";
import {LgPlayer} from "../player/LgPlayer";
import {PolygonData} from "./layout/LgVisibilityZonesHandler";

export type StaticPolygonData = {
    id: string,
    position: [number, number],
    polygons: PolygonData[],
}

export type MiscData = {
    spawnPoints: [number, number][],
    worldPositions: Record<string, [number, number]>,
    staticPolygons: Record<string, StaticPolygonData>,
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
