import React, {useEffect, useMemo} from "react"
import {setStartingPosition} from "../state/backend/scene";
import {LgPlayer} from "../player/LgPlayer";

export type MiscData = {
    spawnPoints: [number, number][],
}

export const MiscDataHandler: React.FC<{
    data: MiscData,
}> = ({data}) => {

    useEffect(() => {
        if (data.spawnPoints.length) {
            setStartingPosition(data.spawnPoints[0][0], data.spawnPoints[0][1])
        }
    }, [data])

    return null
}
