export default function Tabs({ value, onChange }:{value:string; onChange:(v:any)=>void}){
  return (
    <div className="tabs">
      <button className={`tab ${value==='self' ? 'active':''}`} onClick={()=>onChange('self')}> Xe tự lái</button>
      <button className={`tab ${value==='withDriver' ? 'active':''}`} onClick={()=>onChange('withDriver')}> Xe có tài xế</button>
      <button className={`tab ${value==='longTerm' ? 'active':''}`} onClick={()=>onChange('longTerm')}> Thuê xe dài hạn</button>
    </div>
  );
}
