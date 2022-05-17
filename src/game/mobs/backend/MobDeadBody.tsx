import React, {useEffect} from "react"

export const MobDeadBody: React.FC<{
    id: string,
    x: number,
    y: number,
}> = ({id, x, y}) => {

    useEffect(() => {
        console.log('dead body', id, x, y)
    }, [])

    return null
}
