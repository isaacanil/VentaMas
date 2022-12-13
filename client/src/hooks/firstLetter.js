export const firstLetter = (word) => {
    
    if(typeof word !== undefined || typeof word !== null || word !== ""){
        let first = String(word)[0].toUpperCase()
        let rest = String(word).toLowerCase().slice(1)
        return word = first + rest
    }else{
        return ""
    }
}