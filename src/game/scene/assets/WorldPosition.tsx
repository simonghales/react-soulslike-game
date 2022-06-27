import React from "react"
import {Circle} from "@react-three/drei";
import {WorldPositionId} from "../../data/ids";

export const worldPositionInputsConfig = {
    inputs: {
        pointId: {
            key: 'pointId',
            label: 'Point Id',
            defaultValue: '',
            options: {
                options: Object.keys(WorldPositionId),
            }
        },
    }
}

export const WorldPositionPreview: React.FC = () => {
    return (
        <Circle args={[0.5]}>
            <meshBasicMaterial color={'orange'} transparent opacity={0.5}/>
        </Circle>
    )
}
