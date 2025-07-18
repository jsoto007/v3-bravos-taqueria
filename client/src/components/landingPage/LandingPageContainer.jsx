import LandingPageHero from "./LandingPageHero"
import LandingPagePricing from "./LandingPagePricing"
import Footer from "../../shared/Footer"
import LandingPageLogos from "./LandingPageLogos"
import LandingPageNav from "./LandingPageNav"

export default function LandingPageContainer() {

    return (
        <>  
            <LandingPageNav />
            <LandingPageHero />
            <LandingPageLogos />
            <LandingPagePricing />
        </>
    )
}