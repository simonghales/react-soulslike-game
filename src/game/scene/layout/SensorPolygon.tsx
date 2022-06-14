import { PolygonPreview } from "@simonghales/react-three-scene-editor"
import React from "react"
import {SensorId} from "../../data/ids";

export const sensorZoneInputsConfig = {
    inputs: {
        zoneId: {
            key: 'zoneId',
            label: 'Zone Id',
            defaultValue: '',
            options: {
                options: Object.keys(SensorId),
            }
        },
    }
}

export const SensorPolygonAsset: typeof PolygonPreview = (props: any) => <PolygonPreview color={'red'} {...props}/>
