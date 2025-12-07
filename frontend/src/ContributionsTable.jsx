export default function ContributionsTable({ wallet }) {
  const dummy = [
    { title: "Rainfall Data 2023", timestamp: "2025-01-02" },
    { title: "ImageSet v2", timestamp: "2025-02-11" },
  ];

  return (
    <table className="w-full text-white border-collapse bg-white/10 rounded-xl overflow-hidden backdrop-blur-xl border border-white/20">
      <thead className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
        <tr>
          <th className="px-4 py-3 text-left">Dataset</th>
          <th className="px-4 py-3 text-left">Timestamp</th>
        </tr>
      </thead>

      <tbody>
        {dummy.map((item, i) => (
          <tr key={i} className="border-b border-white/20">
            <td className="px-4 py-3">{item.title}</td>
            <td className="px-4 py-3">{item.timestamp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
