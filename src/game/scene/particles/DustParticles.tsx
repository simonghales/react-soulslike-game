import React, {useMemo, useRef, useState} from "react"
import {useTexture} from "@react-three/drei";
import {BloodSprayParticleArgs, fragShader, ParticleControls, tempObject, vertShader} from "./BloodSprayParticles";
import {useRegisterControls} from "./particlesManagerContext";
import {ParticleType} from "./ParticlesManager";
import {useFrame} from "@react-three/fiber";
import {InstancedBufferAttribute, InstancedMesh, Object3D} from "three";
import {degToRad, lerp} from "three/src/math/MathUtils";
import {normalize} from "../../../utils/numbers";
import {easeInOutCubic, easeInQuart, easeOutQuart} from "../../../utils/easing";

export enum DustType {
    SMALL,
    MEDIUM,
    LARGE,
}

const dustAgeLimit = {
    [DustType.SMALL]: 500,
    [DustType.MEDIUM]: 1200,
    [DustType.LARGE]: 2000,
}

export type DustParticleArgs = {
    x: number,
    y: number,
    type: DustType,
}

let ageLimit = 0
let timeElapsed = 0
let progress = 0
let scaleProgress = 0
let now = 0
let x = 0
let y = 0
let time = 0
let type = DustType.MEDIUM
let angle = 0
let scale = 0

export type DustData = [x: number, y: number, angle: number, time: number, type: DustType]

const cleanupOldData = (particles: DustData[]) => {
    now = performance.now()
    particles.forEach(([,,,time, type], index) => {
        ageLimit = dustAgeLimit[type] ?? 0
        timeElapsed = now - time
        if (timeElapsed > ageLimit) {
            particles.splice(index, 1)
        }
    })
}

type DustAttributes = {
    scale: number,
    alpha: number,
}

const dustAttributes: DustAttributes = {
    scale: 0,
    alpha: 1,
}

let fadeInProgress = 0
let fadeOutProgress = 0
let alpha = 0

const calculateDustAttributes = (dustAttributes: DustAttributes, data: DustData, now: number) => {

    [,,,time, type] = data

    ageLimit = dustAgeLimit[type] ?? 0
    timeElapsed = now - time

    scaleProgress = normalize(timeElapsed, ageLimit - ((ageLimit / 2) - 350), 0)
    scaleProgress = easeOutQuart(scaleProgress)
    scale = lerp(0.3, 1, scaleProgress)
    dustAttributes.scale = scale

    fadeInProgress = normalize(timeElapsed, 300, 0)
    fadeOutProgress = normalize(timeElapsed, ageLimit, (ageLimit / 2) - 200)

    if (fadeInProgress < 1) {
        fadeInProgress = easeOutQuart(fadeInProgress)
        alpha = lerp(0, 0.75, fadeInProgress)
        // console.log('fadeInProgress', fadeInProgress, alpha)
    } else {
        fadeOutProgress = easeInQuart(fadeOutProgress)
        alpha = lerp(0.75, 0, fadeOutProgress)
        // console.log('fadeOutProgress', fadeOutProgress, alpha)
    }

    dustAttributes.alpha = alpha

    return dustAttributes
}

export const DustParticles: React.FC = () => {

    const particleCount = 128

    const [data] = useState(() => {
        return {
            attributes: {
                footstepsAlpha: new Float32Array(Array.from({length: particleCount}).map(() => 1)),
            },
            particles: [] as DustData[], // todo - store more efficiently / performantly
        }
    })

    const footStepsRef = useRef<InstancedMesh>()
    const alphaRef = useRef<InstancedBufferAttribute>()

    useFrame(() => {

        const mesh = footStepsRef.current
        const alphaAttribute = alphaRef.current

        if (!mesh || !alphaAttribute) return

        now = performance.now()

        data.particles.forEach((data, index) => {

            [x, y, angle, time, type] = data

            calculateDustAttributes(dustAttributes, data, now)

            // @ts-ignore
            alphaAttribute.array[index] = dustAttributes.alpha

            tempObject.scale.set(dustAttributes.scale, dustAttributes.scale, dustAttributes.scale)
            tempObject.position.set(x, y, 0.00001 + (index * 0.00001))
            tempObject.rotation.set(0, 0, angle)
            tempObject.updateMatrix()
            mesh.setMatrixAt(index, tempObject.matrix)

        })

        alphaAttribute.needsUpdate = true
        mesh.instanceMatrix.needsUpdate = true
        mesh.count = data.particles.length

    })

    useRegisterControls(ParticleType.DUST, useMemo<ParticleControls>(() => {
        return {
            initParticle: ({
                               x,
                               y,
                type,
                           }: DustParticleArgs) => {

                data.particles.push([x, y, degToRad( lerp(0, 360, Math.random())), performance.now(), type])

                cleanupOldData(data.particles)

            }
        }
    }, []))

    const texture = useTexture("/assets/textures/dust_small.png")

    const uniforms = useMemo(
        () => ({
            vTexture: {type: "t", value: texture}
        }),
        [])

    return (
        <>
            <instancedMesh ref={footStepsRef} args={[null, null, particleCount] as any} matrixAutoUpdate={false}>
                <planeBufferGeometry attach="geometry" args={[1, 1]}>
                    <instancedBufferAttribute ref={alphaRef} attach="attributes-instanceOpacity" args={[data.attributes.footstepsAlpha, 1]} />
                </planeBufferGeometry>
                <shaderMaterial attach="material" uniforms={uniforms} vertexShader={vertShader}
                                fragmentShader={fragShader} transparent depthWrite={false} depthTest={false}/>
            </instancedMesh>
        </>
    )
}
