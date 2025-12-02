import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import SignIn from "./assets/pages/SignIn.jsx";
import CreateAcc from "./assets/pages/CreateAcc.jsx";
import Home from "./assets/pages/Home.jsx";
import UserDash from "./assets/pages/UserDash.jsx";
import EmployeeDash from "./assets/pages/EmployeeDash.jsx";
import GameDetails from "./assets/pages/GameDetails.jsx";

function Main() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default landing page → Sign In */}
        <Route path="/" element={<SignIn />} />

        {/* Explicit sign-in route */}
        <Route path="/signin" element={<SignIn />} />

        <Route path="/signup" element={<CreateAcc />} />
        <Route path="/home" element={<Home />} />
        <Route path="/userdash" element={<UserDash />} />
        <Route path="/employeedash" element={<EmployeeDash />} />

        {/* Game details with dynamic ID */}
        <Route path="/game/:gameId" element={<GameDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
