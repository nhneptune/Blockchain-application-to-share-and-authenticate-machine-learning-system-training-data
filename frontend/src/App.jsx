import { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import UploadFile from "./UploadFile";
import RegisterData from "./RegisterData";
import ContributionsTable from "./ContributionsTable";

function App() {
  const [verifiedHash, setVerifiedHash] = useState("");
  return (
    <div style={{ padding: "20px" }}>
      <h2>Blockchain ML Data Sharing</h2>
      <ConnectWallet />
      <UploadFile onHashVerified={setVerifiedHash} />
      <RegisterData verifiedHash={verifiedHash} />
      <ContributionsTable />
    </div>
  );
}

export default App;

