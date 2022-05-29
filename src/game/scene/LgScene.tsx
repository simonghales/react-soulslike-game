import React from "react"
import {LgWall} from "./layout/LgWall";
import {LgSensor} from "./layout/LgSensor";

export const LgScene: React.FC = () => {
    return (
        <>
            <LgWall x={-3} y={-6} w={2} h={12}/>
            <LgWall x={3} y={-6} w={2} h={12}/>
            <LgWall x={0} y={-12} w={8} h={2}/>
            <LgWall x={-8} y={-1} w={10} h={2}/>
            <LgWall x={8} y={-1} w={10} h={2}/>
            <LgWall x={12} y={7} w={2} h={18}/>
            <LgWall x={-12} y={7} w={2} h={18}/>
            <LgWall x={0} y={15} w={22} h={2}/>

            <LgSensor x={0} y={8} w={22} h={16} sensorId={'room'}/>
        </>
    )
}
