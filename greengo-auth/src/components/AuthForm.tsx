import { useState } from "react";
import type { Mode } from "../App";
import IconEye from "./IconEye";

type Props = {
  mode: Mode;
  onSwitch: () => void;
};

export default function AuthForm({ mode, onSwitch }: Props) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);

  const title = mode === "login" ? "Đăng nhập" : "Đăng kí";
  const cta = mode === "login" ? "Đăng nhập ngay" : "Đăng kí ngay";
  const bottomText =
    mode === "login" ? (
      <>Chưa có tài khoản? <button className="link" onClick={onSwitch}>Đăng ký miễn phí</button></>
    ) : (
      <>Chưa đã có tài khoản? <button className="link" onClick={onSwitch}>Đăng nhập</button></>
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      JSON.stringify(
        { mode, email, pw, remember },
        null,
        2
      )
    );
  };

  return (
    <section className="panel">
      <div className="lang">
        <button className="lang-btn" aria-label="Đổi ngôn ngữ">VIE 🇻🇳</button>
      </div>

      <div className="panel-inner">
        <h2 className="title">{title}</h2>
        <p className="subtitle">
          {mode === "login"
            ? "Nhập thông tin để truy cập tài khoản"
            : "Nhập thông tin để đăng kí tài khoản"}
        </p>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Địa chỉ Email</span>
            <input
              type="email"
              placeholder={mode === "login" ? "Đăng nhập email" : "example@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="input-wrap">
              <input
                type={show ? "text" : "password"}
                placeholder="Nhập mật khẩu của bạn"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                title={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <IconEye open={show} />
              </button>
            </div>
          </label>

          <div className="row between">
            <label className="check">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <button className="link" type="button">Quên mật khẩu?</button>
          </div>

          <button className="primary" type="submit">{cta}</button>

          <div className="divider"><span>Hoặc {mode === "login" ? "đăng nhập" : "đăng kí"} với</span></div>

          <div className="row social">
            <button type="button" className="social-btn">
              <span>G</span> Google
            </button>
            <button type="button" className="social-btn">
              <span>f</span> Facebook
            </button>
          </div>

          <p className="bottom">{bottomText}</p>

          <div className="foot-links">
            <a>Điều khoản</a> • <a>Bảo mật</a> • <a>Hỗ trợ</a>
          </div>
        </form>
      </div>
    </section>
  );
}
