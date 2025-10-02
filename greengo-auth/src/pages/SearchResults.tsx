import { useSearchParams, Link } from "react-router-dom";

export default function SearchResults(){
  const [params] = useSearchParams();
  const city  = params.get("city")  ?? "";
  const start = params.get("start") ?? "";
  const end   = params.get("end")   ?? "";
  const mode  = params.get("mode")  ?? "self";

  // TODO: call API tìm xe với { city, start, end, mode }

  return (
    <div className="container" style={{paddingTop: 24}}>
      <h1 style={{color:"var(--primary-700)", marginBottom:8}}>Kết quả tìm xe</h1>
      <p className="subtitle">
        {city} · {start} → {end} · {mode === "self" ? "Xe tự lái" : mode === "withDriver" ? "Xe có tài xế" : "Thuê dài hạn"}
      </p>

      <div className="card" style={{padding:16, marginTop:16}}>
        <div className="subtitle">Demo: Chưa nối API. Hãy map dữ liệu ở đây.</div>
      </div>

      <p style={{marginTop:16}}><Link to="/home">← Sửa bộ lọc</Link></p>
    </div>
  );
}
