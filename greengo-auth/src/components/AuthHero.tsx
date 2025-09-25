import Logo from "./Logo";
import type { Mode } from "../App";

export default function AuthHero({ mode }: { mode: Mode }) {
  return (
    <aside className="hero">
      <div className="hero-inner">
        <Logo size={160} />
        <div className="hero-text">
          <h1>{mode === "login" ? "Chào mừng trở lại!" : "Chào mừng đến với GreenGo!"}</h1>
          <p>
            {mode === "login"
              ? "Đăng nhập để tiếp tục hành trình của bạn cùng chúng tôi"
              : "Đăng kí để tiếp tục hành trình của bạn cùng chúng tôi"}
          </p>
        </div>
      </div>
    </aside>
  );
}
