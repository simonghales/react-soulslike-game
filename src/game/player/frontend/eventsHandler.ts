import {MutableRefObject, useMemo} from "react";
import {Object3D} from "three";
import {useOnCustomMessage} from "@simonghales/react-three-physics";
import {PLAYER_EVENTS_KEY} from "../../data/keys";
import {MobDamagedEvent, MobEvent} from "../../mobs/brain/events";
import {normalize} from "../../../utils/numbers";
import {sceneManagerControls, SceneManagerControlsTypes} from "../../scene/sceneManagerContext";
import {ParticleType} from "../../scene/particles/ParticlesManager";
import {PlayerBaseEvent, PlayerDamagedEvent, PlayerEventType} from "../../events/player";
import {lerp} from "three/src/math/MathUtils";

export const useEventsHandler = (ref: MutableRefObject<Object3D>) => {

    useOnCustomMessage(PLAYER_EVENTS_KEY, useMemo(() => {

        const handleDamaged = (message: PlayerDamagedEvent) => {

            const object = ref.current

            if (!object) return

            const norm = normalize(message.damage + 2, 20, 1)

            const damageMultiplier = lerp(20, 40, norm)

            sceneManagerControls[SceneManagerControlsTypes.particles].initParticle(
                ParticleType.BLOOD_SPRAY,
                {
                    x: object.position.x,
                    y: object.position.y,
                    xVel: message.x * damageMultiplier,
                    yVel: message.y * damageMultiplier,
                }
            )

            console.log('damaged', message)

        }

        const callback = (message: PlayerBaseEvent) => {

            switch (message.type) {
                case PlayerEventType.DAMAGED:
                    handleDamaged(message as PlayerDamagedEvent)
                    break;
            }

        }

        return callback

    }, []))

}
