import { cities } from "../data/cities";

type Props = {
  city:string; onCity:(v:string)=>void;
  start:string; end:string; onStart:(v:string)=>void; onEnd:(v:string)=>void;
  onFind:()=>void;
};

export default function SearchBar({ city,onCity,start,end,onStart,onEnd,onFind }: Props){
  return (
    <div className="grid">
      <div>
        <div className="label">Địa điểm</div>
        <div className="select-wrap">
          <select className="select" value={city} onChange={e=>onCity(e.target.value)}>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
          <span className="chev">▾</span>
        </div>
      </div>
      <div>
        <div className="label">Thời gian bắt đầu</div>
        <input className="input" type="datetime-local" value={start} onChange={e=>onStart(e.target.value)} />
      </div>
      <div>
        <div className="label">Thời gian kết thúc</div>
        <input className="input" type="datetime-local" value={end} onChange={e=>onEnd(e.target.value)} />
      </div>
      <div className="actions-col">
        <button className="btn btn-primary find" onClick={onFind}>Tìm xe</button>
      </div>
    </div>
  );
}
