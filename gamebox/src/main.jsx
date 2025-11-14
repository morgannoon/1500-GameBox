import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from "./assets/pages/SignIn.jsx";
import CreateAcc from "./assets/pages/CreateAcc.jsx";
import Home from "./assets/pages/Home.jsx";
import UserDash from "./assets/pages/UserDash.jsx";


function Main() {
  return (
    <BrowserRouter>
    <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/signin" element={<SignIn />} />
  <Route path="/signup" element={<CreateAcc />} />
  <Route path="/Home" element={<Home />} />
  <Route path="/UserDash" element={<UserDash />} />

</Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
