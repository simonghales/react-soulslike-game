import React from "react"
import {LgWall} from "./LgWall";

export type WallData = {
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
}

export const LgWallsHandler: React.FC<{
    walls: WallData[],
}> = ({walls}) => {
    return (
        <>
            {
                walls.map(wall => (
                    <LgWall key={wall.id} x={wall.x} y={wall.y} w={wall.w} h={wall.h}/>
                ))
            }
        </>
    )

}
