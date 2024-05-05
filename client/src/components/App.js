import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import BirdPage from "./BirdPage";
import BirdDetail from "./BirdDetail"
import CarsList from "./CarsList";

function App() {


    return (
        <>
          <main>
            <Header />
            <Routes>
              <Route path="/:id" element={ <BirdDetail /> }/>
              <Route path="/" element={ <BirdPage /> }/>
              <Route path="/cars" element={ <CarsList /> }/>
            </Routes>
          </main>
        </>
      );
}

export default App;
