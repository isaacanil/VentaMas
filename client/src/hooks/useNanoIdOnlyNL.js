import { customAlphabet } from 'nanoid'

export const useNanoIdOnlyNL = () => {
    const customID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)
    return customID()
}
