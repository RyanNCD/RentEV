import { useNavigate } from "react-router-dom";
import AuthHero from "../components/AuthHero";
import AuthForm from "../components/AuthForm";

export default function RegisterPage() {
  const nav = useNavigate();
  return (
    <div className="auth-page">
      <AuthHero
        title="Chào mừng đến với GreenGo!"
        subtitle="Đăng kí để tiếp tục hành trình của bạn cùng chúng tôi"
      />
      <AuthForm
        mode="register"
        onSwitch={() => nav("/login")}
      />
    </div>
  );
}
