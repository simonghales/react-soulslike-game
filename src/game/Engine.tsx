import React, {useEffect, useState} from "react"
import {KeysCapture, PlanckjsPhysicsConsumer} from "react-three-physics";

// @ts-ignore
import PhysicsWorker from '../worker/physics.worker';

export const Engine: React.FC = ({children}) => {

    const [worker] = useState(() => new PhysicsWorker())

    return (
        <PlanckjsPhysicsConsumer worker={worker}>
            <KeysCapture/>
            {children}
        </PlanckjsPhysicsConsumer>
    )

}
