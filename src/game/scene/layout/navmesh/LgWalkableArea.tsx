import React, {useEffect} from "react"
import {globalNavMeshHandler} from "./handler";

export const LgWalkableArea: React.FC<{
    x: number,
    y: number,
    w: number,
    h: number,
}> = ({x, y, w, h}) => {

    useEffect(() => {
        const id = globalNavMeshHandler.addPolygon(x, y, w, h)
        return () => {
            globalNavMeshHandler.removePolygon(id)
        }
    }, [x, y, w, h])

    return null
}
