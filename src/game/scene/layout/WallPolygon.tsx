import React from "react"
import {PolygonPreview} from "@simonghales/react-three-scene-editor";

const color = '#525762'

export const WallPolygonAsset: typeof PolygonPreview = (props: any) => <PolygonPreview color={color} {...props}/>
