import ConnectWallet from "./ConnectWallet";
import UploadFile from "./UploadFile";
import RegisterData from "./RegisterData";
import ContributionsTable from "./ContributionsTable";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Blockchain ML Data Sharing</h2>
      <ConnectWallet />
      <UploadFile />
      <RegisterData />
      <ContributionsTable />
    </div>
  );
}

export default App;
