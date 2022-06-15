import { Sphere } from "@react-three/drei"
import React from "react"
import {MobType} from "../../state/game";

export const mobInputsConfig = {
    inputs: {
        mobType: {
            key: 'mobType',
            label: 'Mob Type',
            defaultValue: MobType.BASIC_RAT,
            options: {
                options: [MobType.BASIC_RAT, MobType.LARGE_RAT],
            },
        }
    }
}

export const BasicRatPreview: React.FC<{
    mobType: string,
}> = ({mobType = MobType.BASIC_RAT}) => {

    const radius = mobType === MobType.LARGE_RAT ? 1.75 : 1

    return (
        <Sphere args={[radius]}/>
    )
}

export const BasicRat: React.FC = () => {
    return null
}
