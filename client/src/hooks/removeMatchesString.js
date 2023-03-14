import { useState } from "react"

export const removeMatchesString = (string, matches) => {
    let paragraph = String(string)
    let regex = matches
    let found = paragraph.match(regex)
    found = found.toString()
    return found
}