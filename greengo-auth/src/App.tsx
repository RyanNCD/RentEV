import { useState } from "react";
import AuthHero from "./components/AuthHero";
import AuthForm from "./components/AuthForm";

export type Mode = "login" | "register";

export default function App() {
  const [mode, setMode] = useState<Mode>("login"); // chuyển qua lại login/register

  return (
    <div className="auth-page">
      <AuthHero mode={mode} />
      <AuthForm
        mode={mode}
        onSwitch={() => setMode(mode === "login" ? "register" : "login")}
      />
    </div>
  );
}
