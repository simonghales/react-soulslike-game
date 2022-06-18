import React from "react"
import {LgWall} from "./LgWall";
import {useSnapshot} from "valtio";
import {sceneStateProxy} from "../../state/backend/scene";

export type WallData = {
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    breakable?: boolean,
    breakableHealth?: string,
    onDestroyKey?: string,
    removeOnStateFlag?: string,
}

export const LgWallsHandler: React.FC<{
    walls: WallData[],
}> = ({walls}) => {

    const destroyedWalls = useSnapshot(sceneStateProxy.destroyedWalls)

    return (
        <>
            {
                walls.map(wall => {
                    if (destroyedWalls[wall.id]) return null
                    return (
                        <LgWall key={wall.id} data={wall}/>
                    )
                })
            }
        </>
    )

}
