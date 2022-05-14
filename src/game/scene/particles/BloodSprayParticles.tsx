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

export type OLDBloodSprayParticleInstance = {
    angle: number,
    x: number,
    y: number,
    vX: number,
    vY: number,
    time: number,
}

export type ParticleInstance = {
    vX: number,
    vY: number,
    angle: number,
}

export type BloodSprayParticleInstance = {
    x: number,
    y: number,
    time: number,
    main: ParticleInstance[],
    spray: ParticleInstance[],
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

type ParticlesData = {
    OLDinstances: OLDBloodSprayParticleInstance[],
    instances: BloodSprayParticleInstance[],
    mainCount: number,
    sprayCount: number,
}

const cleanupOlderInstances = (data: ParticlesData, particleCount: number) => {

    let mainExcess = data.mainCount - particleCount
    let sprayExcess = data.sprayCount - particleCount

    if (mainExcess <= 0 && sprayExcess <= 0) {
        return
    }

    let iterations = 0

    while (((mainExcess > 0) || (sprayExcess > 0)) && (iterations < particleCount)) {
        iterations +=1 // make sure we don't loop forever...
        const instance = data.instances[0]
        if (!instance) {
            iterations = particleCount
            return
        }
        mainExcess -= instance.main.length
        sprayExcess -= instance.spray.length
        data.mainCount -= instance.main.length
        data.sprayCount -= instance.spray.length
        data.instances.splice(0, 1)
    }

}

const generateMainParticles = (count: number, xVel: number, yVel: number) => {

    const particles: ParticleInstance[] = []

    for (let i = 0; i < count; i++) {
        v2.set(xVel, yVel)
        const mul = lerp(1, 0.25, Math.random())
        v2.mul(mul)
        rotateVector(v2, degToRad(lerp(-10 * i, 10 * i, Math.random()) + i * 2))
        angle = v2ToAngle(v2.x, v2.y)
        particles.push({
            angle,
            vX: v2.x,
            vY: v2.y,
        })
    }

    return particles

}

const generateSprayParticles = (count: number, xVel: number, yVel: number) => {

    const particles: ParticleInstance[] = []

    for (let i = 0; i < count; i++) {
        v2.set(xVel, yVel)
        const mul = lerp(2, 1, Math.random())
        v2.mul(mul)
        rotateVector(v2, degToRad(lerp(-10 * i, 10 * i, Math.random()) + i * 2))
        angle = v2ToAngle(v2.x, v2.y)
        particles.push({
            angle,
            vX: v2.x,
            vY: v2.y,
        })
    }

    return particles

}

export const BloodSprayParticles: React.FC = () => {

    const particleCount = 256

    const [alphaValues] = useState(() => new Float32Array(Array.from({length: particleCount}).map(() => 0.25)))
    const [smallSprayAlphaValues] = useState(() => new Float32Array(Array.from({length: particleCount}).map(() => 0.25)))

    const [data] = useState<ParticlesData>(() => {
        return {
            OLDinstances: [] as OLDBloodSprayParticleInstance[],
            instances: [] as BloodSprayParticleInstance[],
            mainCount: 0,
            sprayCount: 0,
        }
    })

    const meshRef = useRef<any>()
    const smallSprayRef = useRef<any>()

    const update = () => {
        now = Date.now()

        let mainIndex = 0
        let sprayIndex = 0

        data.instances.forEach((instance) => {

            age = now - instance.time
            if (age > maxAge) age = maxAge
            progress = easeOutQuart(normalize(age, maxAge, 0))

            instance.main.forEach((particle, i) => {

                x = lerp(instance.x, instance.x + (particle.vX * 0.015), progress)
                y = lerp(instance.y, instance.y + (particle.vY * 0.015), progress)
                tempObject.position.set(x, y, 0.1)
                tempObject.rotation.set(0, 0, particle.angle)
                tempObject.updateMatrix()
                meshRef.current.setMatrixAt(mainIndex, tempObject.matrix)

                mainIndex += 1
            })

            instance.spray.forEach((particle, i) => {

                x = lerp(instance.x, instance.x + (particle.vX * 0.02), progress)
                y = lerp(instance.y, instance.y + (particle.vY * 0.02), progress)
                tempObject.position.set(x, y, 0.1)
                tempObject.rotation.set(0, 0, particle.angle)
                tempObject.updateMatrix()
                smallSprayRef.current.setMatrixAt(sprayIndex, tempObject.matrix)

                sprayIndex += 1
            })

        })

        // data.OLDinstances.forEach((instance, i) => {
        //     age = now - instance.time
        //     if (age > maxAge) age = maxAge
        //     progress = easeOutQuart(normalize(age, maxAge, 0))
        //     x = instance.x
        //     y = instance.y
        //     x = lerp(x, instance.x + (instance.vX * 0.015), progress)
        //     y = lerp(y, instance.y + (instance.vY * 0.015), progress)
        //     tempObject.position.set(x, y, 0.1)
        //     tempObject.rotation.set(0, 0, instance.angle)
        //     tempObject.updateMatrix()
        //     meshRef.current.setMatrixAt(i, tempObject.matrix)
        //
        //     x = lerp(instance.x, instance.x + (instance.vX * 0.025), progress)
        //     y = lerp(instance.y, instance.y + (instance.vY * 0.025), progress)
        //
        //     tempObject.position.set(x, y, 0.1)
        //     tempObject.updateMatrix()
        //     smallSprayRef.current.setMatrixAt(i, tempObject.matrix)
        // })

        meshRef.current.instanceMatrix.needsUpdate = true

        smallSprayRef.current.instanceMatrix.needsUpdate = true

    }

    useFrame(() => {
        update()
    })

    useRegisterControls(ParticleType.BLOOD_SPRAY, useMemo<ParticleControls>(() => {
        return {
            initParticle: (type: ParticleType, x: number, y: number, xVel: number, yVel: number) => {

                const numberOfMain = 4
                const numberOfSpray = 6

                data.instances.push({
                    x,
                    y,
                    time: Date.now(),
                    main: generateMainParticles(numberOfMain, xVel, yVel),
                    spray: generateSprayParticles(numberOfSpray, xVel, yVel),
                })

                data.mainCount += numberOfMain
                data.sprayCount += numberOfSpray

                cleanupOlderInstances(data, particleCount)

                // if (data.mainCount >= particleCount || data.sprayCount >= particleCount) {
                //     // todo - delete old data instances...
                // }
                //
                //
                // let iteration = 0
                //
                // const add = () => {
                //     v2.set(xVel, yVel)
                //     rotateVector(v2, degToRad(lerp(-10 * iteration, 10 * iteration, Math.random()) + iteration * 2))
                //     angle = v2ToAngle(v2.x, v2.y)
                //     data.OLDinstances.push({
                //         angle,
                //         x,
                //         y,
                //         vX: v2.x,
                //         vY: v2.y,
                //         time: Date.now(),
                //     })
                //     iteration += 1
                // }
                //
                // for (let i = 0; i < numberOfMain; i++) {
                //     add()
                // }
                //
                // if (data.OLDinstances.length >= particleCount) {
                //     const excess = data.OLDinstances.length - particleCount
                //     data.OLDinstances.splice(0, excess)
                // }
            }
        }
    }, []))

    return (
        <>
            <instancedMesh ref={meshRef} args={[null, null, particleCount] as any} matrixAutoUpdate={false}>
                <planeBufferGeometry attach="geometry" args={[1, 1]}>
                    <instancedBufferAttribute attach="attributes-instanceOpacity" args={[alphaValues, 1]} />
                </planeBufferGeometry>
                <meshBasicMaterial transparent opacity={0.5} color={'red'}/>
                {/*<shaderMaterial attach="material" uniforms={uniforms} vertexShader={vertShader}*/}
                {/*                fragmentShader={fragShader} transparent/>*/}
            </instancedMesh>
            <instancedMesh ref={smallSprayRef} args={[null, null, particleCount] as any} matrixAutoUpdate={false}>
                <planeBufferGeometry attach="geometry" args={[0.5, 0.5]}>
                    <instancedBufferAttribute attach="attributes-instanceOpacity" args={[smallSprayAlphaValues, 1]} />
                </planeBufferGeometry>
                <meshBasicMaterial transparent opacity={0.5} color={'red'}/>
                {/*<shaderMaterial attach="material" uniforms={uniforms} vertexShader={vertShader}*/}
                {/*                fragmentShader={fragShader} transparent/>*/}
            </instancedMesh>
        </>
    )
}
