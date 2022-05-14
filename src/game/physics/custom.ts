import {PlanckjsBuffersData} from "@simonghales/react-three-physics/dist/declarations/src/physics/planckjs/buffers";
import { MutableRefObject } from "react";
import {Object3D} from "three";

let xIndex: number = 0
let yIndex: number = 0
let angleIndex: number = 0

export const mapBufferDataToObjectRef = (
    buffers: PlanckjsBuffersData,
    index: number,
    objectRef: MutableRefObject<Object3D>,
    rotateRef?: MutableRefObject<Object3D>,
) => {

    xIndex = index * 2
    yIndex = (index * 2) + 1
    angleIndex = index

    if (!objectRef.current) return

    objectRef.current.position.set(buffers.positions[xIndex], buffers.positions[yIndex], objectRef.current.position.z)

    if (!rotateRef || !rotateRef.current) return

    rotateRef.current.rotation.set(rotateRef.current.rotation.x, rotateRef.current.rotation.y, buffers.angles[angleIndex])

}
