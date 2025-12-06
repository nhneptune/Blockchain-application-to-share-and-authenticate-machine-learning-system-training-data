const crypto = require("crypto");
const fs = require("fs");

/**
 * Hash file content using SHA256
 */
function hashFileServer(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Fetch contract data for range of IDs
 */
async function fetchRangeData(contract, start, end) {
  const ids = [];
  for (let i = start; i < end; i++) ids.push(i);

  const promises = ids.map(async (i) => {
    const entry = await contract.getData(i);
    const owner = entry[0];
    const hash = entry[1];
    const timestamp = entry[2];
    return {
      id: i,
      owner,
      hash,
      timestamp: typeof timestamp === "bigint" ? Number(timestamp) : Number(timestamp?.toString?.() ?? 0)
    };
  });

  return Promise.all(promises);
}

module.exports = {
  hashFileServer,
  fetchRangeData
};
