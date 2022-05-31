import React, {useEffect, useMemo, useState} from "react"
import {navMeshData, PolygonData} from "./data";
import {BufferGeometry, DoubleSide, Shape, Vector3} from "three";
import {Plane, Sphere} from "@react-three/drei";
import {NavMesh} from "navmesh";
import {getNavMeshPath} from "./handler";

const extrudeSettings = {
    depth: 0.001,
};
const lineExtrudeSettings = {
    depth: 0.5,
};

const Polygon: React.FC<{
    data: PolygonData,
}> = ({data}) => {

    const shape = useMemo<Shape>(() => {
        const shape = new Shape()
        shape.moveTo(data[0].x, data[0].y)
        data.forEach((polygon, index) => {
            if (index === 0) return
            shape.lineTo(polygon.x, polygon.y)
        })
        shape.lineTo(data[0].x, data[0].y)
        return shape
    }, [])

    return (
        <mesh>
            <extrudeBufferGeometry args={[shape, extrudeSettings]}/>
            <meshBasicMaterial color={'cyan'} transparent opacity={0.2}/>
        </mesh>
    )
}

const size = 256

const VisualisedPath: React.FC<{
    path: {x: number, y: number}[],
}> = ({path}) => {

    const lineGeometry = useMemo<BufferGeometry>(() => {
        const points: any[] = []
        path.forEach(point => {
            points.push(new Vector3(point.x, point.y, 0))
        })
        return new BufferGeometry().setFromPoints(points)
    }, [path])

    return (
        // @ts-ignore
        <line geometry={lineGeometry}>
            <lineBasicMaterial attach="material" color={'#9c88ff'} linewidth={10} linecap={'round'} linejoin={'round'} />
        </line>
    )

}

const Visualiser: React.FC = () => {

    const [startPoint, setStartPoint] = useState([-3, 3] as [number, number])
    const [endPoint, setEndPoint] = useState(null as null | [number, number])
    const [path, setPath] = useState(null as null | {x: number, y: number}[])

    const navMesh = useMemo(() => {
        return new NavMesh(navMeshData.polygons)
    }, [])

    useEffect(() => {
        if (!endPoint) return
        // const path = navMesh.findPath({ x: startPoint[0], y: startPoint[1] }, { x: endPoint[0], y: endPoint[1] });
        const path = getNavMeshPath(startPoint[0], startPoint[1], endPoint[0], endPoint[1])
        if (!path) {
            console.log('no path found?')
        }
        setPath(path)
    }, [startPoint, endPoint, navMesh])

    return (
        <>
            <Plane args={[size, size]} onClick={(event) => {
                setEndPoint([event.point.x, event.point.y] as [number, number])
            }} visible={false}/>
            <Sphere position={[startPoint[0], startPoint[1], 0]}/>
            {
                endPoint && (
                    <Sphere position={[endPoint[0], endPoint[1], 0]}/>
                )
            }
            {
                path && (
                    <VisualisedPath path={path}/>
                )
            }
        </>
    )

}

export const NavMeshGuide: React.FC = () => {
    return (
        <>
            {
                navMeshData.polygons.map((data, index) => (
                    <Polygon data={data} key={index}/>
                ))
            }
            <Visualiser/>
        </>
    )
}
