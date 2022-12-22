import { useEffect, useState } from "react"

export const useCheckForInternetConnection = () => {
    const [isConnected, setIsConnected] = useState(navigator.onLine)
    useEffect(()=>{
        const handleOnline = () => setIsConnected(true)
        const handleOffline = () => setIsConnected(false)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        }
        
    }, [])
    return isConnected;
}