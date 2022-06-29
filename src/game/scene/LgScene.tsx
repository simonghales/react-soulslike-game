import React, {useEffect, useMemo, useState} from "react"
import {LgNavMeshHandler, WalkableAreaData} from "./layout/navmesh/LgNavMeshHandler";
import {useOnCustomMessage, useSendCustomMessage} from "@simonghales/react-three-physics";
import {messageKeys} from "../data/keys";
import {
    basicRatConfig, collectableItemConfig, interactionTriggerConfig,
    sceneWallConfig,
    sensorConfig,
    sensorPolygonConfig, spawnPointConfig, staticPolygonConfig,
    visibilityZoneConfig,
    walkableAreaConfig, worldPositionConfig
} from "./layout/types";
import {LgWallsHandler, WallData} from "./layout/LgWallsHandler";
import {LgSensorsHandler, SensorData} from "./layout/LgSensorsHandler";
import {LgMobsHandler, MobData} from "./mobs/LgMobsHandler";
import {MobType} from "../state/game";
import {LgVisibilityZonesHandler, VisibilityZoneData} from "./layout/LgVisibilityZonesHandler";
import {LgSensorZonesHandler, SensorZoneData} from "./layout/LgSensorZonesHandler";
import {MiscData, MiscDataHandler} from "./MiscDataHandler";
import {LgPlayer} from "../player/LgPlayer";
import {InteractionTriggerData, LgInteractionTriggersHandler} from "./assets/LgInteractionTriggersHandler";
import {SceneComponentsManager} from "./SceneComponentsManager";
import {ItemData, ItemsData, ItemsManager} from "./items/ItemsManager";
import {LgDynamicStateHandler} from "../state/backend/LgDynamicStateHandler";
import {setMiscData, useIsSceneLoaded} from "../state/backend/scene";
import {SceneIds} from "../data/scenes";

const useSceneManager = () => {

    const activeScenes = useMemo(() => {
        return [SceneIds.l0, SceneIds.l1]
    }, [])

    return {
        activeScenes,
    }

}

export const LgScene: React.FC = () => {

    const {
        activeScenes,
    } = useSceneManager()

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
        interactionTriggers,
        items,
    } = useMemo(() => {

        const walls: WallData[] = []
        const sensors: SensorData[] = []
        const mobs: MobData[] = []
        const walkableAreas: WalkableAreaData[] = []
        const visibilityZones: VisibilityZoneData[] = []
        const sensorZones: SensorZoneData[] = []
        const miscData: MiscData = {
            spawnPoints: [],
            worldPositions: {},
            staticPolygons: {},
        }
        const interactionTriggers: InteractionTriggerData[] = []
        const items: ItemData[] = []

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
                        breakable: instance.breakable,
                        breakableHealth: instance.breakableHealth,
                        onDestroyKey: instance.onDestroyKey,
                        removeOnStateFlag: instance.removeOnStateFlag,
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
                        removeOnStateFlag: instance.removeOnStateFlag,
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
                case interactionTriggerConfig.id:
                    interactionTriggers.push({
                        id: instance.id,
                        position: instance._position,
                        onInteractionKey: instance.onInteractionKey,
                        enableOnTrigger: instance.enableOnTrigger,
                        physical: instance.physical,
                    })
                    break;
                case worldPositionConfig.id:
                    miscData.worldPositions[instance.pointId] = [instance._position[0], instance._position[1]]
                    break;
                case collectableItemConfig.id:
                    items.push({
                        id: instance.id,
                        position: [instance._position[0], instance._position[1]],
                        itemType: instance.itemType,
                    })
                    break;
                case staticPolygonConfig.id:
                    miscData.staticPolygons[instance.zoneId] = {
                        id: instance.id,
                        polygons: instance._polygons,
                        position: [instance._position[0], instance._position[1]],
                    }
                    break;
            }

        })

        setMiscData(miscData)

        return {
            walls,
            sensors,
            mobs,
            walkableAreas,
            visibilityZones,
            sensorZones,
            miscData,
            interactionTriggers,
            items,
        }
    }, [instances])

    const sceneLoaded = useIsSceneLoaded()

    if (!sceneLoaded) return null

    return (
        <MiscDataHandler data={miscData}>
            <ItemsManager items={items}/>
            <LgNavMeshHandler walkableAreas={walkableAreas}/>
            <LgWallsHandler walls={walls}/>
            <LgSensorsHandler sensors={sensors}/>
            <LgMobsHandler mobs={mobs}/>
            <LgVisibilityZonesHandler data={visibilityZones}/>
            <LgSensorZonesHandler zones={sensorZones}/>
            <LgInteractionTriggersHandler data={interactionTriggers}/>
            {
                loaded && (
                    <LgPlayer/>
                )
            }
            <LgDynamicStateHandler/>
            <SceneComponentsManager/>
        </MiscDataHandler>
    )
}
