import React from "react"
import {LgWall} from "./layout/LgWall";
import {LgSensor} from "./layout/LgSensor";
import {LgNavMeshHandler} from "./layout/navmesh/LgNavMeshHandler";

export const LgScene: React.FC = () => {
    return (
        <>
            <LgNavMeshHandler/>
            <LgWall x={-8} y={-1} w={10} h={2}/>
            <LgWall x={8} y={-1} w={10} h={2}/>
            <LgWall x={12} y={7} w={2} h={18}/>
            <LgWall x={-12} y={7} w={2} h={18}/>
            <LgWall x={0} y={15} w={22} h={2}/>
            <LgWall x={-1.5} y={-17} w={11} h={2}/>
            <LgWall x={-3} y={-6} w={2} h={12}/>
            {/*<LgWall x={-5} y={-6} w={2} h={12}/>*/}
            <LgWall x={-6.75} y={-10.5} w={0.5} h={12}/>
            <LgWall x={-12.5} y={-4.75} w={6} h={0.5}/>
            <LgWall x={3} y={-8} w={2} h={16}/>
            <LgWall x={-16} y={1} w={2} h={12}/>
            <LgWall x={-15} y={7} w={5} h={2}/>
            <LgWall x={-20} y={-6} w={10} h={2}/>
            <LgWall x={-26} y={-12} w={2} h={14}/>
            <LgWall x={-16} y={-18} w={20} h={2}/>
            <LgSensor x={0} y={8} w={22} h={16} sensorId={'room'}/>
        </>
    )
}
