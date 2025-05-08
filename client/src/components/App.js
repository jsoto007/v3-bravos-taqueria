import { Routes, Route } from "react-router-dom";
import Header from "./Header";
import BirdPage from "./BirdPage";
import BirdDetail from "./BirdDetail"
import CarsList from "./CarsList";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";

function App() {


    return (
        <>
          <main>
            <Header />
            <Routes>
              <Route path="/" element={ <BirdPage /> }/>
              <Route path="/:id" element={ <BirdDetail /> }/>
              <Route path="/sign_up" element={ <SignUpForm /> }/>
              <Route path="/login_user" element={ <LoginForm /> }/>
              <Route path="/cars" element={ <CarsList /> }/>
            </Routes>
          </main>
        </>
      );
}

export default App;
