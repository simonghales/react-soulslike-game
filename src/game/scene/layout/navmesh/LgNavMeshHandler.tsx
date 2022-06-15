import React, {useEffect} from "react"
import {globalNavMeshHandler} from "./handler";

export type WalkableAreaData = {
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
}


export const LgNavMeshHandler: React.FC<{
    walkableAreas: WalkableAreaData[],
}> = ({walkableAreas}) => {

    useEffect(() => {
        globalNavMeshHandler.setPolygons(walkableAreas)
    }, [walkableAreas])

    return null
}
