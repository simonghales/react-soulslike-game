import React, {useEffect} from "react"

export const DebugPath: React.FC<{
    path: any[],
}> = ({path}) => {

    useEffect(() => {
        console.log('path', path)
    }, [path])

    return null
}
