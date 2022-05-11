import React, {useEffect} from "react"
import {usePlayerContext} from "./PlayerContext";
import {playerConfig} from "./config";
import {useEffectRef} from "../../utils/hooks";

const useEnergyHandler = () => {

    const {
        energyLastUsed,
        energyUsage,
        setEnergyUsage,
    } = usePlayerContext()

    const hasUsedEnergy = energyUsage > 0
    const hasNoEnergy = energyUsage >= playerConfig.defaultEnergy
    const hasNoEnergyRef = useEffectRef(hasNoEnergy)

    useEffect(() => {
        if (!hasUsedEnergy) return
        let interval: any;
        let timeout: any;

        const hasNoEnergy = hasNoEnergyRef.current

        const begin = () => {
            interval = setInterval(() => {
                setEnergyUsage((prev: number) => {
                    if ((prev - playerConfig.rechargeAmount) < 0) {
                        return 0
                    }
                    return prev - playerConfig.rechargeAmount
                })
            }, 50)
        }

        if (hasNoEnergy) {
            timeout = setTimeout(begin, 1300)
        } else {
            timeout = setTimeout(begin, 300)
        }

        return () => {
            if (interval) {
                clearInterval(interval)
            }
            if (timeout) {
                clearTimeout(timeout)
            }
        }

    }, [hasUsedEnergy, energyLastUsed])

}

export const PlayerStateHandler: React.FC = () => {

    useEnergyHandler()

    return null
}
