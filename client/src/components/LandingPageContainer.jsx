import LandingPageHero from "./LandingPageHero"
import LandingPagePricing from "./LandingPagePricing"
import Footer from "./Footer"
import LandingPageLogos from "./LandingPageLogos"

export default function LandingPageContainer() {

    return (
        <>  
            <LandingPageHero />
            <LandingPageLogos />
            <LandingPagePricing />
            <Footer />
        </>
    )
}