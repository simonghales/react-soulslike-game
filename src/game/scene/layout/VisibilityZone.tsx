import React, {useEffect, useMemo} from "react"
import { PolygonPreview } from "@simonghales/react-three-scene-editor"
import {VisibilityZoneData} from "./LgVisibilityZonesHandler";
import { Shape } from "three";
import {GameWorldStateIds, SensorId, VISIBILITY_IDS} from "../../data/ids";

export const visibilityZoneInputsConfig = {
    inputs: {
        zoneId: {
            key: 'zoneId',
            label: 'Zone Id',
            defaultValue: '',
            options: {
                options: VISIBILITY_IDS,
            }
        },
        hiddenZones: {
            key: 'hiddenZones',
            label: 'Hidden Zones',
            defaultValue: '',
            options: {
                options: Object.keys(SensorId),
            }
        },
        hiddenZonesList: {
            key: 'hiddenZonesList',
            label: 'Hidden Zones List',
            defaultValue: '',
        },
        partialVisibilityZonesList: {
            key: 'partialVisibilityZonesList',
            label: 'Partial Visibility Zones List',
            defaultValue: '',
        },
        removeOnStateFlag: {
            key: 'removeOnStateFlag',
            label: 'Remove On State Flag',
            defaultValue: '',
            options: {
                options: ['', ...Object.keys(GameWorldStateIds)],
            },
        }
    }
}

export const VisibilityZoneAsset: typeof PolygonPreview = PolygonPreview

const extrudeSettings = {
    depth: 0.001,
};

export const VisibilityZone: React.FC<{
    data: VisibilityZoneData,
    isHidden: boolean,
    partiallyVisible: boolean,
}> = ({data, isHidden, partiallyVisible}) => {

    const polygons = data.polygons

    const shape = useMemo<Shape>(() => {
        const shape = new Shape()
        if (polygons.length === 0) {
            return shape
        }
        shape.moveTo(polygons[0].x, polygons[0].y)
        polygons.forEach((polygon, index) => {
            if (index === 0) return
            shape.lineTo(polygon.x, polygon.y)
        })
        shape.lineTo(polygons[0].x, polygons[0].y)
        return shape
    }, [polygons])

    return (
        <mesh position={[data.x, data.y, 0]}>
            <extrudeBufferGeometry args={[shape, extrudeSettings]}/>
            <meshBasicMaterial color={'black'} transparent opacity={isHidden ? 0 : partiallyVisible ? 0.5 : 1} depthWrite={false} depthTest={false}/>
        </mesh>
    )
}
