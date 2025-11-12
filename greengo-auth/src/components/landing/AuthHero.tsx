type Props = { title: string; subtitle: string };

export default function AuthHero({ title, subtitle }: Props) {
  return (
    <aside className="hero">
      <div className="hero-inner">
        <img src="/images/logo.png" alt="GreenGo" style={{ width: 180, height: "auto" }} />
        <div className="hero-text">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
    </aside>
  );
}
