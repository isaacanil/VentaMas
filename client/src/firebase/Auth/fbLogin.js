import { useDispatch } from "react-redux"
import { login } from "../../features/auth/userSlice"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebaseconfig"
import { useNavigate } from "react-router-dom"

export const fbLogin = async ( user, homePath, navigate, dispatch) => {
    const {email, password} = user
  
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredencial) => {
            const user = userCredencial.user
            dispatch(login({
                email: user.email,
                uid: user.uid,
                displayName: user.displayName
            }))
            navigate(homePath)
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage)
        })
}