type Props = {
  city: string;
  from: string;
  to: string;
  onCity: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onSearch: () => void;
};

export default function SearchBar({ city, from, to, onCity, onFrom, onTo, onSearch }: Props) {
  return (
    <form
      className="searchbar"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <label className="field big">
        <span>Địa điểm</span>
        <div className="input-like">
          <span className="icon"></span>
          <input placeholder="Thành phố Hồ Chí Minh" value={city} onChange={(e) => onCity(e.target.value)} />
          <span className="chev">▾</span>
        </div>
      </label>

      <label className="field big">
        <span>Thời gian thuê</span>
        <div className="input-like range">
          <span className="icon"></span>
          <input type="datetime-local" value={from} onChange={(e) => onFrom(e.target.value)} />
          <span className="dash">—</span>
          <input type="datetime-local" value={to} onChange={(e) => onTo(e.target.value)} />
          <span className="chev">▾</span>
        </div>
      </label>

      <button className="btn cta" type="submit">Tìm xe</button>
    </form>
  );
}
