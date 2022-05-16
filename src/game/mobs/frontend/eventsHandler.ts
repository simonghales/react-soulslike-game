import {useOnCustomMessage} from "@simonghales/react-three-physics";
import {getMobEventsKey} from "../../data/keys";
import {MutableRefObject, useCallback, useMemo} from "react";
import {MobDamagedEvent, MobEvent, MobEventType} from "../brain/events";
import {sceneManagerControls, SceneManagerControlsTypes} from "../../scene/sceneManagerContext";
import {Object3D} from "three";
import {ParticleType} from "../../scene/particles/ParticlesManager";
import {normalize} from "../../../utils/numbers";

export const useEventsHandler = (id: string, ref: MutableRefObject<Object3D>) => {

    useOnCustomMessage(getMobEventsKey(id), useMemo(() => {

        const handleDamaged = (message: MobDamagedEvent) => {

            const object = ref.current

            if (!object) return

            const damageMultiplier = normalize(message.damage + 2, 20, 1)

            sceneManagerControls[SceneManagerControlsTypes.particles].initParticle(
                ParticleType.BLOOD_SPRAY,
                {
                    x: object.position.x,
                    y: object.position.y,
                    xVel: message.x * damageMultiplier,
                    yVel: message.y * damageMultiplier,
                }
            )
        }

        const callback = (message: MobEvent) => {

            switch (message.type) {
                case MobEventType.DAMAGED:
                    handleDamaged(message as MobDamagedEvent)
                    break;
            }

        }

        return callback

    }, []))

}
