import React, {useEffect, useMemo, useRef, useState} from "react"
import {Object3D} from "three";
import {ParticleType} from "./ParticlesManager";
import {useRegisterControls} from "./particlesManagerContext";
import {useFrame} from "@react-three/fiber";
import {normalize} from "../../../utils/numbers";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {easeOutExpo, easeOutQuart} from "../../../utils/easing";
import {Vec2} from "planck";
import {rotateVector, v2ToAngle} from "../../../utils/angles";

const fragShader = `
    uniform sampler2D vTexture;
    varying vec2 vUv;
    varying float vInstanceOpacity;
    void main() {
      vec4 color = texture2D(vTexture, vUv);
      //gl_FragColor = vec4(0.18, 0.54, 0.34, vInstanceOpacity);
      vec4 transparent = vec4(0, 0, 0, 0);
      gl_FragColor = mix(transparent, color, vInstanceOpacity);
    }
`

const vertShader = `
    varying vec2 vUv;
    attribute float instanceOpacity;
    varying float vInstanceOpacity;
    
    void main() {
        vInstanceOpacity = instanceOpacity;
        vec3 transformed = vec3( position );
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        #endif
        vec4 modelViewPosition = modelViewMatrix * mvPosition;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewPosition;
    }
`

export const useBloodSprayParticles = () => {

    useEffect(() => {

    }, [])

}

const tempObject = new Object3D()

export type BloodSprayParticleInstance = {
    angle: number,
    x: number,
    y: number,
    vX: number,
    vY: number,
    time: number,
}

export type ParticleControls = {
    initParticle: (type: ParticleType, x: number, y: number, xVel: number, yVel: number) => void,
}

let x = 0
let y = 0
const maxAge = 200
let age = 0
let now = 0
let progress = 0
let angle = 0

const v2 = new Vec2()

export const BloodSprayParticles: React.FC = () => {

    const particleCount = 128

    const [alphaValues] = useState(() => new Float32Array(Array.from({length: particleCount}).map(() => 0.25)))

    const [data] = useState(() => {
        return {
            instances: [] as BloodSprayParticleInstance[],
        }
    })

    const meshRef = useRef<any>()

    const update = () => {
        now = Date.now()
        data.instances.forEach((instance, i) => {
            age = now - instance.time
            if (age > maxAge) age = maxAge
            progress = easeOutQuart(normalize(age, maxAge, 0))
            x = instance.x
            y = instance.y
            x = lerp(x, instance.x + (instance.vX * 0.015), progress)
            y = lerp(y, instance.y + (instance.vY * 0.015), progress)
            tempObject.position.set(x, y, 0.1)
            tempObject.rotation.set(0, 0, instance.angle)
            tempObject.updateMatrix()
            meshRef.current.setMatrixAt(i, tempObject.matrix)
        })
        meshRef.current.instanceMatrix.needsUpdate = true
    }

    useFrame(() => {
        update()
    })

    useRegisterControls(ParticleType.BLOOD_SPRAY, useMemo<ParticleControls>(() => {
        return {
            initParticle: (type: ParticleType, x: number, y: number, xVel: number, yVel: number) => {

                let iteration = 0

                const add = () => {
                    v2.set(xVel, yVel)
                    rotateVector(v2, degToRad(lerp(-10 * iteration, 10 * iteration, Math.random()) + iteration * 2))
                    angle = v2ToAngle(v2.x, v2.y)
                    data.instances.push({
                        angle,
                        x,
                        y,
                        vX: v2.x,
                        vY: v2.y,
                        time: Date.now(),
                    })
                    iteration += 1
                }

                add()
                add()
                add()
                add()

                if (data.instances.length >= particleCount) {
                    const excess = data.instances.length - particleCount
                    data.instances.splice(0, excess)
                }
            }
        }
    }, []))

    return (
        <>
            <instancedMesh ref={meshRef} args={[null, null, particleCount] as any} matrixAutoUpdate={false}>
                <planeBufferGeometry attach="geometry" args={[1, 1]}>
                    <instancedBufferAttribute attach="attributes-instanceOpacity" args={[alphaValues, 1]} />
                    {/*<instancedBufferAttribute  attachObject={["attributes", "instanceOpacity"]} args={[alphaValues, 1]}/>*/}
                </planeBufferGeometry>
                <meshBasicMaterial transparent opacity={0.5} color={'red'}/>
                {/*<shaderMaterial attach="material" uniforms={uniforms} vertexShader={vertShader}*/}
                {/*                fragmentShader={fragShader} transparent/>*/}
            </instancedMesh>
        </>
    )
}
