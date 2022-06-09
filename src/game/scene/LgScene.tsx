import React, {useEffect, useMemo, useState} from "react"
import {LgWall} from "./layout/LgWall";
import {LgNavMeshHandler, WalkableAreaData} from "./layout/navmesh/LgNavMeshHandler";
import { useSceneData } from "@simonghales/react-three-scene-editor";
import {useOnCustomMessage, useSendCustomMessage} from "@simonghales/react-three-physics";
import {messageKeys} from "../data/keys";
import {basicRatConfig, sceneWallConfig, sensorConfig, walkableAreaConfig} from "./layout/types";
import {LgWallsHandler, WallData} from "./layout/LgWallsHandler";
import {LgSensorsHandler, SensorData} from "./layout/LgSensorsHandler";
import {LgMobsHandler, MobData} from "./mobs/LgMobsHandler";
import {MobType} from "../state/game";

export const LgScene: React.FC = () => {

    const sendCustomMessage = useSendCustomMessage()

    useEffect(() => {
        sendCustomMessage(messageKeys.sceneDataReady, null)
    }, [])

    const [instances, setInstances] = useState({} as Record<string, any>)

    useOnCustomMessage(messageKeys.sceneData, (data: any) => {
        setInstances(data?.instances ?? {})
    })

    const {
        walls,
        sensors,
        mobs,
        walkableAreas,
    } = useMemo(() => {

        const walls: WallData[] = []
        const sensors: SensorData[] = []
        const mobs: MobData[] = []
        const walkableAreas: WalkableAreaData[] = []

        Object.entries(instances).forEach(([id, instance]) => {

            switch (instance._type) {
                case sceneWallConfig.id:
                    walls.push({
                        id,
                        x: instance._position[0],
                        y: instance._position[1],
                        w: instance._width,
                        h: instance._depth,
                    })
                    break;
                case sensorConfig.id:
                    sensors.push({
                        id,
                        x: instance._position[0],
                        y: instance._position[1],
                        w: instance._width,
                        h: instance._depth,
                        sensorId: instance.sensorId,
                    })
                    break;
                case basicRatConfig.id:
                    mobs.push({
                        id,
                        x: instance._position[0],
                        y: instance._position[1],
                        type: instance.mobType ?? MobType.BASIC_RAT,
                    })
                    break;
                case walkableAreaConfig.id:
                    walkableAreas.push({
                        id,
                        x: instance._position[0],
                        y: instance._position[1],
                        w: instance._width,
                        h: instance._depth,
                    })
                    break;
            }

        })

        return {
            walls,
            sensors,
            mobs,
            walkableAreas,
        }
    }, [instances])

    return (
        <>
            <LgNavMeshHandler walkableAreas={walkableAreas}/>
            <LgWallsHandler walls={walls}/>
            <LgSensorsHandler sensors={sensors}/>
            <LgMobsHandler mobs={mobs}/>
        </>
    )
}
