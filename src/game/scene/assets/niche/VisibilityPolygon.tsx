import React from "react"
import {StaticPolygonData} from "../../MiscDataHandler";
import {Sphere} from "@react-three/drei";
import {usePolygonShape} from "@simonghales/react-three-scene-editor";
import {AlwaysDepth} from "three";

const extrudeSettings = {
    depth: 0.001,
};

export const VisibilityPolygon: React.FC<{
    data: StaticPolygonData,
}> = ({data}) => {

    const shape = usePolygonShape(data.polygons)

    return (
        <mesh position={[data.position[0], data.position[1], 0]}>
            <extrudeBufferGeometry args={[shape, extrudeSettings]}/>
            <meshBasicMaterial color={"black"} depthWrite={false} depthTest={false}/>
        </mesh>
    )
}
