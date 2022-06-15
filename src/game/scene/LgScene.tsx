import React, {useEffect, useMemo, useState} from "react"
import {LgWall} from "./layout/LgWall";
import {LgNavMeshHandler, WalkableAreaData} from "./layout/navmesh/LgNavMeshHandler";
import { useSceneData } from "@simonghales/react-three-scene-editor";
import {useOnCustomMessage, useSendCustomMessage} from "@simonghales/react-three-physics";
import {messageKeys} from "../data/keys";
import {
    basicRatConfig,
    sceneWallConfig,
    sensorConfig,
    sensorPolygonConfig, spawnPointConfig,
    visibilityZoneConfig,
    walkableAreaConfig
} from "./layout/types";
import {LgWallsHandler, WallData} from "./layout/LgWallsHandler";
import {LgSensorsHandler, SensorData} from "./layout/LgSensorsHandler";
import {LgMobsHandler, MobData} from "./mobs/LgMobsHandler";
import {MobType} from "../state/game";
import {LgVisibilityZonesHandler, VisibilityZoneData} from "./layout/LgVisibilityZonesHandler";
import {LgSensorZonesHandler, SensorZoneData} from "./layout/LgSensorZonesHandler";
import {MiscData, MiscDataHandler} from "./MiscDataHandler";
import {LgPlayer} from "../player/LgPlayer";

export const LgScene: React.FC = () => {

    const sendCustomMessage = useSendCustomMessage()

    useEffect(() => {
        sendCustomMessage(messageKeys.sceneDataReady, null)
    }, [])

    const [loaded, setLoaded] = useState(false)
    const [instances, setInstances] = useState({} as Record<string, any>)

    useOnCustomMessage(messageKeys.sceneData, (data: any) => {
        setInstances(data?.instances ?? {})
        setLoaded(true)
    })

    const {
        walls,
        sensors,
        mobs,
        walkableAreas,
        visibilityZones,
        sensorZones,
        miscData,
    } = useMemo(() => {

        const walls: WallData[] = []
        const sensors: SensorData[] = []
        const mobs: MobData[] = []
        const walkableAreas: WalkableAreaData[] = []
        const visibilityZones: VisibilityZoneData[] = []
        const sensorZones: SensorZoneData[] = []
        const miscData: MiscData = {
            spawnPoints: [],
        }

        Object.entries(instances).forEach(([id, instance]) => {

            if (instance._disabled) return

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
                case visibilityZoneConfig.id:
                    const hiddenZones: string[] = []
                    const partialVisibilityZones: string[] = []
                    if (instance.hiddenZones) {
                        hiddenZones.push(instance.hiddenZones)
                    }
                    if (instance.hiddenZonesList) {
                        hiddenZones.push(...instance.hiddenZonesList.split(','))
                    }
                    if (instance.partialVisibilityZonesList) {
                        partialVisibilityZones.push(...instance.partialVisibilityZonesList.split(','))
                    }
                    visibilityZones.push({
                        id,
                        x: instance._position[0],
                        y: instance._position[1],
                        polygons: instance._polygons,
                        hiddenZones: hiddenZones,
                        partialVisibilityZones,
                    })
                    break;
                case sensorPolygonConfig.id:
                    sensorZones.push({
                        id,
                        sensorId: instance.zoneId,
                        x: instance._position[0],
                        y: instance._position[1],
                        polygons: instance._polygons,
                    })
                    break;
                case spawnPointConfig.id:
                    miscData.spawnPoints.push([instance._position[0], instance._position[1]])
                    break;
            }

        })

        return {
            walls,
            sensors,
            mobs,
            walkableAreas,
            visibilityZones,
            sensorZones,
            miscData,
        }
    }, [instances])

    return (
        <>
            <LgNavMeshHandler walkableAreas={walkableAreas}/>
            <LgWallsHandler walls={walls}/>
            <LgSensorsHandler sensors={sensors}/>
            <LgMobsHandler mobs={mobs}/>
            <LgVisibilityZonesHandler data={visibilityZones}/>
            <LgSensorZonesHandler zones={sensorZones}/>
            <MiscDataHandler data={miscData}/>
            {
                loaded && (
                    <LgPlayer/>
                )
            }
        </>
    )
}

// -5.897269730308776,-12.362094879863545
