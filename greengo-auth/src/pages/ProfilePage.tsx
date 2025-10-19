import React, { useEffect, useState } from "react";
import "./profile.css";
import { getMe, updateProfile, changePassword, uploadAvatar, getMyBookings, type User, type Booking } from "../services/user";

type Tab = "overview" | "documents" | "security" | "bookings";

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  // forms
  const [form, setForm] = useState<Partial<User>>({});
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmNew: "" });

  useEffect(() => {
    (async () => {
      try {
        const data = await getMe();
        setMe(data);
        setForm({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          identityCard: data.identityCard,
          driverLicense: data.driverLicense,
        });
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === "bookings" && bookings === null) {
      getMyBookings()
        .then(setBookings)
        .catch(() => setBookings([]));
    }
  }, [tab, bookings]);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null); setMsg(null);
    try {
      await updateProfile(form);
      setMsg("Đã lưu thay đổi.");
      setMe((prev) => (prev ? { ...prev, ...form } as User : prev));
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const onChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (pwd.newPassword !== pwd.confirmNew) {
      setErr("Mật khẩu xác nhận không khớp."); return;
    }
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setMsg("Đã đổi mật khẩu.");
      setPwd({ currentPassword: "", newPassword: "", confirmNew: "" });
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Đổi mật khẩu thất bại.");
    }
  };

  const onAvatar = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      const { url } = await uploadAvatar(f);
      setForm((s) => ({ ...s, avatarUrl: url }));
      setMe((m) => (m ? { ...m, avatarUrl: url } : m));
      setMsg("Đã cập nhật ảnh đại diện.");
    } catch {
      setErr("Tải ảnh thất bại.");
    }
  };

  if (loading) return <div className="container profile-wrap"><p>Đang tải hồ sơ…</p></div>;

  return (
    <div className="container profile-wrap">
      <header className="profile-header">
        <div className="profile-avatar">
          <img src={me?.avatarUrl || "/avatar-placeholder.png"} alt="" />
          <label className="btn-secondary">
            Tải ảnh
            <input type="file" accept="image/*" onChange={onAvatar} hidden />
          </label>
        </div>
        <div className="profile-summary">
          <h1>{me?.fullName || "Khách hàng"}</h1>
          <p className="muted">{me?.email}</p>
          <p className="muted">Đã tham gia: {me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : "—"}</p>
        </div>
      </header>

      <nav className="profile-tabs">
        <button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Thông tin cá nhân</button>
        <button className={tab==="documents"?"active":""} onClick={()=>setTab("documents")}>Giấy tờ</button>
        <button className={tab==="security"?"active":""} onClick={()=>setTab("security")}>Bảo mật</button>
        <button className={tab==="bookings"?"active":""} onClick={()=>setTab("bookings")}>Đơn của tôi</button>
      </nav>

      {msg && <div className="alert success">{msg}</div>}
      {err && <div className="alert error">{err}</div>}

      {/* TAB 1: OVERVIEW */}
      {tab === "overview" && (
        <form className="card form-grid" onSubmit={onSaveProfile}>
          <div className="field">
            <label>Họ và tên</label>
            <input value={form.fullName || ""} onChange={(e)=>setForm({...form, fullName:e.target.value})} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email || ""} onChange={(e)=>setForm({...form, email:e.target.value})} required />
          </div>
          <div className="field">
            <label>Số điện thoại</label>
            <input value={form.phone || ""} onChange={(e)=>setForm({...form, phone:e.target.value})} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu thay đổi"}</button>
          </div>
        </form>
      )}

      {/* TAB 2: DOCUMENTS */}
      {tab === "documents" && (
        <form className="card form-grid" onSubmit={onSaveProfile}>
          <div className="field">
            <label>CMND/CCCD</label>
            <input value={form.identityCard || ""} onChange={(e)=>setForm({...form, identityCard:e.target.value})} />
          </div>
          <div className="field">
            <label>Giấy phép lái xe</label>
            <input value={form.driverLicense || ""} onChange={(e)=>setForm({...form, driverLicense:e.target.value})} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" disabled={saving}>{saving ? "Đang lưu…" : "Lưu giấy tờ"}</button>
          </div>
        </form>
      )}

      {/* TAB 3: SECURITY */}
      {tab === "security" && (
        <form className="card form-grid" onSubmit={onChangePwd}>
          <div className="field">
            <label>Mật khẩu hiện tại</label>
            <input type="password" value={pwd.currentPassword} onChange={(e)=>setPwd({...pwd, currentPassword:e.target.value})} required />
          </div>
          <div className="field">
            <label>Mật khẩu mới</label>
            <input type="password" value={pwd.newPassword} onChange={(e)=>setPwd({...pwd, newPassword:e.target.value})} required />
          </div>
          <div className="field">
            <label>Xác nhận mật khẩu mới</label>
            <input type="password" value={pwd.confirmNew} onChange={(e)=>setPwd({...pwd, confirmNew:e.target.value})} required />
          </div>
          <div className="form-actions">
            <button className="btn-primary">Đổi mật khẩu</button>
          </div>
        </form>
      )}

      {/* TAB 4: BOOKINGS */}
      {tab === "bookings" && (
        <section className="card">
          <h3>Đơn gần đây</h3>
          {!bookings ? (
            <p>Đang tải…</p>
          ) : bookings.length === 0 ? (
            <p className="muted">Bạn chưa có đơn nào.</p>
          ) : (
            <div className="table">
              <div className="thead">
                <span>Mã</span><span>Xe</span><span>Bắt đầu</span><span>Kết thúc</span><span>Trạng thái</span><span>Giá</span>
              </div>
              {bookings.map(b=>(
                <div className="trow" key={b.id}>
                  <span>#{b.id.slice(0,6)}</span>
                  <span>{b.carName}</span>
                  <span>{new Date(b.startDate).toLocaleString()}</span>
                  <span>{new Date(b.endDate).toLocaleString()}</span>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                  <span>{b.price.toLocaleString()}đ</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
