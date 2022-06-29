import React from "react"
import {PolygonPreview} from "@simonghales/react-three-scene-editor";
import {SensorId} from "../../data/ids";

export const staticPolygonInputsConfig = {
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


export const StaticPolygonAsset: typeof PolygonPreview = (props: any) => <PolygonPreview color={'black'} {...props}/>
