import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
    const nav = useNavigate();

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        // TODO: call API login...
        nav("/home"); // sau khi login thành công
    };

    return (
        <div className="container" style={{ paddingTop: 40, maxWidth: 480 }}>
            <h1>Đăng nhập</h1>
            <p className="subtitle">Chào mừng trở lại GreenGo</p>

            <form onSubmit={onSubmit} className="card" style={{ padding: 20, marginTop: 12 }}>
                <label className="label">Email</label>
                <input className="input" name="email" type="email" required placeholder="ban@greengo.vn" />

                <div style={{ height: 10 }} />
                <label className="label">Mật khẩu</label>
                <input className="input" name="password" type="password" required placeholder="••••••••" />

                <div style={{ height: 16 }} />
                <button className="btn btn-primary" style={{ width: "100%" }} type="submit">Đăng nhập</button>

                <p className="subtitle" style={{ textAlign: "center", marginTop: 12 }}>
                    Chưa có tài khoản? <Link to="#">Đăng kí</Link>
                </p>
            </form>

            <p style={{ textAlign: "center", marginTop: 12 }}>
                <Link to="/home">Về trang chủ</Link>
            </p>
        </div>
    );
}
