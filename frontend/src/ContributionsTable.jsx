// file: ContributionsTable.jsx
import React, { useEffect, useState } from "react";

export default function ContributionsTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Giữ nguyên logic fetch data của bạn
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/contributions");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="vitality-card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <h2 className="page-title" style={{margin:0}}>Contributions History</h2>
        <button className="btn-primary" onClick={fetchData}>Refresh</button>
      </div>

      {loading ? <p>Loading data...</p> : (
        <table className="vitality-table">
          <thead>
            <tr>
              <th width="50"></th>
              <th>ID</th>
              <th>Owner</th>
              <th>Dataset Name</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <tr>
                  <td>
                    <button onClick={() => toggleExpanded(item.id)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#4fd1c5'}}>
                      {expandedId === item.id ? "▼" : "▶"}
                    </button>
                  </td>
                  <td><strong>#{item.id}</strong></td>
                  <td style={{fontFamily:'monospace'}}>{item.owner.substring(0, 8)}...</td>
                  <td>{item.metadata?.datasetName || "Unnamed"}</td>
                  <td><span className="status-badge">{item.metadata?.dataType || "Raw"}</span></td>
                  <td>{new Date(item.timestamp * 1000).toLocaleDateString()}</td>
                </tr>
                
                {/* Expand Row */}
                {expandedId === item.id && (
                  <tr style={{background:'#f7fafc'}}>
                    <td colSpan="6" style={{padding:'20px'}}>
                       <div style={{background:'white', padding:'15px', borderRadius:'12px', border:'1px solid #edf2f7'}}>
                          <p><strong>Hash:</strong> {item.hash}</p>
                          <p><strong>Desc:</strong> {item.metadata?.description}</p>
                          <p style={{color:'#666', fontSize:'12px', marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #eee'}}>
                            <strong>Do owner</strong> <code style={{backgroundColor:'#f0f0f0', padding:'2px 6px', borderRadius:'3px'}}>{item.owner.substring(0, 10)}...</code> <strong>{item.type === 'update' ? '🔄 update' : '📤 upload'}</strong>
                          </p>
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}