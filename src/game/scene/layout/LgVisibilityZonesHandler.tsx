import React, {useEffect} from "react"
import {SyncComponent} from "@simonghales/react-three-physics";
import {componentSyncKeys} from "../../data/keys";
import {useIsPlayerInsideSensors} from "../../state/backend/player";

export type PolygonData = {
    x: number,
    y: number,
}

export type VisibilityZoneData = {
    id: string,
    hiddenZones: string[],
    polygons: PolygonData[],
    x: number,
    y: number,
}

const LgVisibilityZone: React.FC<{
    data: VisibilityZoneData,
}> = ({data}) => {

    useEffect(() => {
        console.log('visibility zone?', data)
    }, [])

    const isHidden = useIsPlayerInsideSensors(data.hiddenZones)

    return (
        <SyncComponent isHidden={isHidden} data={data} id={data.id} componentId={componentSyncKeys.visibilityZone}/>
    )
}

export const LgVisibilityZonesHandler: React.FC<{
    data: VisibilityZoneData[],
}> = ({data}) => {

    return (
        <>
            {
                data.map(zone => (
                    <LgVisibilityZone data={zone} key={zone.id}/>
                ))
            }
        </>
    )
}
