import React, { useContext } from "react"
import { UserContext } from "../context/UserContextProvider"
import NavBar from "./NavBar"
import LandingPageNav from "./LandingPageNav"


export default function NavBarContainer() {

    const {currentUser, authLoading} = useContext(UserContext)
    

    return currentUser ? <NavBar /> : <LandingPageNav />;

}