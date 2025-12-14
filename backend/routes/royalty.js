const express = require("express");
const { ethers } = require("ethers");
const { getDatasetById, readDB, writeDB } = require("../metadataDB");

const router = express.Router();

// Load contract ABI
const DataRegistryABI = require("../DataRegistry.json").abi;
const CONTRACT_ADDRESS = process.env.DATAREGISTRY_ADDRESS || "0x...";
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";

if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x...") {
  console.error("❌ DATAREGISTRY_ADDRESS not set in environment");
}

/**
 * POST /royalty/:datasetId/add-contributor
 * Thêm contributor với tỷ lệ đóng góp
 * 
 * Body:
 * - contributorAddress: wallet address của contributor
 * - percentage: Tỷ lệ đóng góp (1-100)
 * - ownerAddress: wallet address của owner
 */
router.post("/:datasetId/add-contributor", async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { contributorAddress, percentage, ownerAddress } = req.body;

    if (!contributorAddress || !percentage || !ownerAddress) {
      return res.status(400).json({ 
        error: "Missing required fields: contributorAddress, percentage, ownerAddress" 
      });
    }

    if (percentage < 1 || percentage > 100) {
      return res.status(400).json({ error: "Percentage must be between 1 and 100" });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Verify ownership
    if (dataset.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can add contributors" });
    }

    console.log(`\n💰 [ROYALTY] Adding contributor to dataset ${datasetId}`);
    console.log(`   Address: ${contributorAddress}`);
    console.log(`   Percentage: ${percentage}%`);

    // Initialize contributors array
    if (!dataset.royalty) {
      dataset.royalty = {
        contributors: [],
        totalRewarded: 0
      };
    }

    // Check duplicate - chỉ kiểm tra trong royalty.contributors, KHÔNG kiểm tra collaborators
    const exists = dataset.royalty.contributors.some(
      c => c.address?.toLowerCase() === contributorAddress.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ error: "Contributor already exists" });
    }

    // Calculate total percentage
    let totalPercentage = dataset.royalty.contributors.reduce((sum, c) => {
      return sum + (c.percentage || 0);
    }, 0);

    if (totalPercentage + percentage > 100) {
      return res.status(400).json({ 
        error: `Total percentage would exceed 100% (current: ${totalPercentage}%, adding: ${percentage}%)` 
      });
    }

    // Add contributor to dataset
    if (!dataset.royalty) {
      dataset.royalty = {
        contributors: [],
        totalRewarded: 0
      };
    }

    dataset.royalty.contributors.push({
      address: contributorAddress.toLowerCase(),
      percentage: percentage,
      totalReward: 0,
      joinedAt: new Date().toISOString()
    });

    // Save to database
    const db = readDB();
    const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
    if (datasetIndex !== -1) {
      db.datasets[datasetIndex] = dataset;
      writeDB(db);
    }

    console.log(`✅ [ROYALTY] Contributor added successfully`);
    console.log(`📊 [ROYALTY] Total contributors: ${dataset.royalty.contributors.length}`);

    return res.json({
      success: true,
      message: `Contributor ${contributorAddress.substring(0, 10)}... added with ${percentage}% royalty`,
      royalty: dataset.royalty
    });
  } catch (err) {
    console.error("❌ Error adding contributor:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /royalty/:datasetId/contributors
 * Lấy danh sách contributors với tỷ lệ royalty
 */
router.get("/:datasetId/contributors", (req, res) => {
  try {
    const { datasetId } = req.params;
    const dataset = getDatasetById(parseInt(datasetId));

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const royalty = dataset.royalty || {
      contributors: [
        {
          address: dataset.ownerAddress,
          percentage: 100,
          totalReward: 0,
          joinedAt: dataset.createdAt
        }
      ],
      totalRewarded: 0
    };

    // Ensure all contributors have required fields
    const contributors = royalty.contributors.map(c => ({
      address: c.address,
      percentage: c.percentage,
      totalReward: c.totalReward || 0,  // Fallback to 0 if not set
      joinedAt: c.joinedAt
    }));

    const totalPercentage = contributors.reduce((sum, c) => sum + c.percentage, 0);

    return res.json({
      success: true,
      datasetId: dataset.id,
      datasetName: dataset.datasetName,
      owner: dataset.ownerAddress,
      contributors: contributors,
      totalPercentage: totalPercentage,
      totalRewarded: royalty.totalRewarded || 0,
      remainingPercentage: 100 - totalPercentage
    });
  } catch (err) {
    console.error("❌ Error fetching contributors:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /royalty/:datasetId/record-usage
 * Ghi nhận việc sử dụng dataset để train model
 * 
 * Body:
 * - trainer: wallet address người training
 * - modelType: Loại model (e.g., "RandomForest", "NeuralNetwork")
 * - accuracy: Accuracy của model (0-10000, representing 0-100%)
 * - rewardPool: Tổng reward pool từ model này
 */
router.post("/:datasetId/record-usage", (req, res) => {
  try {
    const { datasetId } = req.params;
    const { trainer, modelType, accuracy, rewardPool } = req.body;

    if (!trainer || !modelType || accuracy === undefined || !rewardPool) {
      return res.status(400).json({ 
        error: "Missing required fields: trainer, modelType, accuracy, rewardPool" 
      });
    }

    if (accuracy < 0 || accuracy > 10000) {
      return res.status(400).json({ 
        error: "Accuracy must be between 0 and 10000 (0-100%)" 
      });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    console.log(`\n📊 [ROYALTY] Recording model usage for dataset ${datasetId}`);
    console.log(`   Trainer: ${trainer}`);
    console.log(`   Model Type: ${modelType}`);
    console.log(`   Accuracy: ${(accuracy / 100).toFixed(2)}%`);
    console.log(`   Reward Pool: ${rewardPool}`);

    // Initialize royalty object
    if (!dataset.royalty) {
      dataset.royalty = {
        contributors: [
          {
            address: dataset.ownerAddress,
            percentage: 100,
            totalReward: 0,
            joinedAt: dataset.createdAt
          }
        ],
        totalRewarded: 0
      };
    }

    // Initialize modelUsages
    if (!dataset.modelUsages) {
      dataset.modelUsages = [];
    }

    // Calculate and distribute rewards
    const rewards = {};
    let totalDistributed = 0;

    dataset.royalty.contributors.forEach(contributor => {
      const reward = Math.floor((rewardPool * contributor.percentage) / 100);
      rewards[contributor.address] = reward;
      totalDistributed += reward;

      // Update contributor's totalReward
      contributor.totalReward = (contributor.totalReward || 0) + reward;
    });

    // Record model usage
    const modelUsage = {
      trainer: trainer.toLowerCase(),
      modelType: modelType,
      accuracy: accuracy,
      timestamp: new Date().toISOString(),
      rewardPool: rewardPool,
      rewardDistribution: rewards
    };

    dataset.modelUsages.push(modelUsage);
    dataset.royalty.totalRewarded = (dataset.royalty.totalRewarded || 0) + totalDistributed;

    // Save to database
    const db = readDB();
    const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
    if (datasetIndex !== -1) {
      db.datasets[datasetIndex] = dataset;
      writeDB(db);
    }

    console.log(`✅ [ROYALTY] Model usage recorded`);
    console.log(`💰 [ROYALTY] Total distributed: ${totalDistributed}`);

    return res.json({
      success: true,
      message: "Model usage recorded successfully",
      modelUsage: modelUsage,
      rewardDistribution: rewards,
      updatedRoyalty: dataset.royalty
    });
  } catch (err) {
    console.error("❌ Error recording model usage:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /royalty/:datasetId/usage-history
 * Lấy lịch sử sử dụng dataset
 */
router.get("/:datasetId/usage-history", (req, res) => {
  try {
    const { datasetId } = req.params;
    const dataset = getDatasetById(parseInt(datasetId));

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    const usageHistory = dataset.modelUsages || [];

    return res.json({
      success: true,
      datasetId: dataset.id,
      datasetName: dataset.datasetName,
      usageHistory: usageHistory,
      totalUsages: usageHistory.length
    });
  } catch (err) {
    console.error("❌ Error fetching usage history:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /royalty/:datasetId/contributor-rewards/:address
 * Lấy tổng reward của một contributor
 */
router.get("/:datasetId/contributor-rewards/:address", (req, res) => {
  try {
    const { datasetId, address } = req.params;
    const dataset = getDatasetById(parseInt(datasetId));

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    if (!dataset.royalty?.contributors) {
      return res.status(404).json({ error: "No royalty information found" });
    }

    const contributor = dataset.royalty.contributors.find(
      c => c.address.toLowerCase() === address.toLowerCase()
    );

    if (!contributor) {
      return res.status(404).json({ error: "Contributor not found" });
    }

    // Calculate rewards from model usages
    let rewardDetails = [];
    if (dataset.modelUsages) {
      rewardDetails = dataset.modelUsages.map(usage => ({
        timestamp: usage.timestamp,
        modelType: usage.modelType,
        trainer: usage.trainer,
        accuracy: (usage.accuracy / 100).toFixed(2) + "%",
        rewardReceived: usage.rewardDistribution?.[address.toLowerCase()] || 0
      }));
    }

    return res.json({
      success: true,
      datasetId: dataset.id,
      contributorAddress: address,
      percentage: contributor.percentage,
      totalReward: contributor.totalReward || 0,
      joinedAt: contributor.joinedAt,
      rewardDetails: rewardDetails
    });
  } catch (err) {
    console.error("❌ Error fetching contributor rewards:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /royalty/user/:address/total-rewards
 * Lấy tổng reward của user từ tất cả datasets
 */
router.get("/user/:address/total-rewards", (req, res) => {
  try {
    const { address } = req.params;
    const db = readDB();

    let totalRewards = 0;
    let contributionDetails = [];

    db.datasets.forEach(dataset => {
      if (dataset.royalty?.contributors) {
        const contributor = dataset.royalty.contributors.find(
          c => c.address.toLowerCase() === address.toLowerCase()
        );

        if (contributor) {
          totalRewards += contributor.totalReward || 0;
          contributionDetails.push({
            datasetId: dataset.id,
            datasetName: dataset.datasetName,
            percentage: contributor.percentage,
            totalReward: contributor.totalReward || 0,
            joinedAt: contributor.joinedAt
          });
        }
      }
    });

    return res.json({
      success: true,
      userAddress: address,
      totalRewardsEarned: totalRewards,
      contributionCount: contributionDetails.length,
      contributions: contributionDetails
    });
  } catch (err) {
    console.error("❌ Error fetching user rewards:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /royalty/:datasetId/update-contributor/:address
 * Cập nhật tỷ lệ đóng góp của contributor (chỉ owner có thể)
 * 
 * Body:
 * - percentage: Tỷ lệ đóng góp mới (1-100)
 * - ownerAddress: wallet address của owner
 */
router.put("/:datasetId/update-contributor/:address", (req, res) => {
  try {
    const { datasetId, address } = req.params;
    const { percentage, ownerAddress } = req.body;

    if (!percentage || !ownerAddress) {
      return res.status(400).json({ 
        error: "Missing required fields: percentage, ownerAddress" 
      });
    }

    if (percentage < 1 || percentage > 100) {
      return res.status(400).json({ error: "Percentage must be between 1 and 100" });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Verify ownership
    if (dataset.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can update contributors" });
    }

    // Initialize royalty if not exists
    if (!dataset.royalty) {
      dataset.royalty = {
        contributors: [{
          address: dataset.ownerAddress,
          percentage: 100,
          totalReward: 0,
          joinedAt: dataset.createdAt
        }],
        totalRewarded: 0
      };
    }

    if (!dataset.royalty?.contributors || dataset.royalty.contributors.length === 0) {
      return res.status(404).json({ error: "No contributors found" });
    }

    // Find contributor
    const contributor = dataset.royalty.contributors.find(
      c => c.address.toLowerCase() === address.toLowerCase()
    );

    if (!contributor) {
      return res.status(404).json({ error: "Contributor not found" });
    }

    const oldPercentage = contributor.percentage;
    contributor.percentage = percentage;

    // Save to database
    const db = readDB();
    const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
    if (datasetIndex !== -1) {
      db.datasets[datasetIndex] = dataset;
      writeDB(db);
    }

    console.log(`✅ [ROYALTY] Updated ${address} from ${oldPercentage}% to ${percentage}%`);

    return res.json({
      success: true,
      message: `Updated contributor from ${oldPercentage}% to ${percentage}%`,
      contributor: contributor,
      royalty: dataset.royalty
    });
  } catch (err) {
    console.error("❌ Error updating contributor:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /royalty/:datasetId/remove-contributor/:address
 * Xóa contributor (chỉ owner có thể)
 */
router.delete("/:datasetId/remove-contributor/:address", (req, res) => {
  try {
    const { datasetId, address } = req.params;
    const { ownerAddress } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({ error: "ownerAddress is required" });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Verify ownership
    if (dataset.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can remove contributors" });
    }

    if (!dataset.royalty?.contributors) {
      return res.status(404).json({ error: "No contributors found" });
    }

    const initialLength = dataset.royalty.contributors.length;
    dataset.royalty.contributors = dataset.royalty.contributors.filter(
      c => c.address.toLowerCase() !== address.toLowerCase()
    );

    if (dataset.royalty.contributors.length === initialLength) {
      return res.status(404).json({ error: "Contributor not found" });
    }

    // Save to database
    const db = readDB();
    const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
    if (datasetIndex !== -1) {
      db.datasets[datasetIndex] = dataset;
      writeDB(db);
    }

    console.log(`✅ [ROYALTY] Removed contributor ${address}`);

    return res.json({
      success: true,
      message: `Contributor ${address.substring(0, 10)}... removed`,
      royalty: dataset.royalty
    });
  } catch (err) {
    console.error("❌ Error removing contributor:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /royalty/:datasetId/distribute-rewards
 * Phân phối reward cho tất cả contributors
 * 
 * Body:
 * - rewardPool: Tổng số MLDT để phân phối
 * - ownerAddress: wallet address của owner
 */
router.post("/:datasetId/distribute-rewards", async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { rewardPool, ownerAddress } = req.body;

    if (!rewardPool || rewardPool <= 0 || !ownerAddress) {
      return res.status(400).json({ 
        error: "Missing or invalid fields: rewardPool, ownerAddress" 
      });
    }

    const dataset = getDatasetById(parseInt(datasetId));
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Verify ownership
    if (dataset.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can distribute rewards" });
    }

    if (!dataset.royalty?.contributors || dataset.royalty.contributors.length === 0) {
      return res.status(404).json({ error: "No contributors to distribute rewards to" });
    }

    console.log(`\n💳 [ROYALTY] Distributing ${rewardPool} MLDT to dataset ${datasetId}`);
    console.log(`   Current blockchainId: ${dataset.blockchainId}`);

    try {
      // Connect to blockchain
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("PRIVATE_KEY not set in environment");
      }
      const signer = new ethers.Wallet(privateKey, provider);

      // Get current nonce ONCE at the start to prevent nonce conflicts
      let currentNonce = await provider.getTransactionCount(signer.address);
      console.log(`   📍 Starting nonce: ${currentNonce}`);

      // Get contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DataRegistryABI, signer);

      // Try to get dataset count from blockchain to validate blockchainId
      let blockchainId = null;
      let needsRegistration = true;

      // First, try to get a valid dataset from blockchain by attempting to get its data
      if (dataset.blockchainId) {
        try {
          console.log(`   🔍 Checking if dataset exists on blockchain with ID: ${dataset.blockchainId}`);
          const data = await contract.getData(dataset.blockchainId);
          
          // If we can get data, it means the blockchain ID is valid
          if (data && data[0]) { // Check if owner address exists
            blockchainId = dataset.blockchainId;
            needsRegistration = false;
            console.log(`   ✅ Dataset found on blockchain with ID: ${blockchainId}`);
          }
        } catch (e) {
          console.log(`   ⚠️ Dataset not found with stored ID ${dataset.blockchainId}, will register...`);
          needsRegistration = true;
        }
      } else {
        console.log(`   ℹ️ No blockchainId stored, will register dataset...`);
        needsRegistration = true;
      }

      // Register if needed
      if (needsRegistration) {
        console.log(`   📝 Registering dataset on blockchain...`);
        const registerTx = await contract.registerData(
          dataset.versions?.[0]?.hash || "0x0",
          dataset.datasetName || "Unknown Dataset",
          dataset.description || "",
          dataset.dataType || "",
          dataset.fileSize || 0,
          dataset.license || "",
          { nonce: currentNonce }
        );

        currentNonce++; // Increment nonce for next transaction
        console.log(`   📝 Register TX: ${registerTx.hash}`);
        const registerReceipt = await registerTx.wait();
        console.log(`   ✅ Register TX mined`);

        // Get the data ID from event logs
        let found = false;
        for (const log of registerReceipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'DataRegistered') {
              // DataRegistered event: args[0] = id, args[1] = owner, args[2] = hash, etc.
              blockchainId = Number(parsedLog.args[0]);
              found = true;
              console.log(`   ✅ Dataset registered with blockchain ID: ${blockchainId}`);
              break;
            }
          } catch (e) {
            // Skip logs that can't be parsed
          }
        }

        if (!found || blockchainId === null || blockchainId === undefined) {
          throw new Error("Could not extract blockchain ID from registration event");
        }

        // Update local database with blockchain ID
        const db = readDB();
        const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
        if (datasetIndex !== -1) {
          db.datasets[datasetIndex].blockchainId = blockchainId;
          writeDB(db);
          console.log(`   💾 Updated local database with blockchain ID: ${blockchainId}`);
        }
      }

      // Validate blockchainId before calling distributeRewardsBatch
      if (blockchainId === null || blockchainId === undefined || typeof blockchainId !== 'number' || blockchainId < 0) {
        throw new Error(`Invalid blockchainId: ${blockchainId}`);
      }

      // Sync contributors to blockchain
      console.log(`   👥 Syncing ${dataset.royalty.contributors.length} contributors to blockchain...`);
      let contributorsAdded = 0;
      for (const contributor of dataset.royalty.contributors) {
        try {
          console.log(`      Checking if contributor exists: ${contributor.address} (${contributor.percentage}%)`);
          
          // Try to add contributor with explicit nonce
          // If it already exists, the contract will reject with "already exists" error
          try {
            const addTx = await contract.addContributor(
              blockchainId,
              contributor.address,
              contributor.percentage,
              { nonce: currentNonce }
            );
            
            currentNonce++; // ONLY increment nonce if transaction actually sent
            console.log(`      TX: ${addTx.hash}`);
            const receipt = await addTx.wait();
            console.log(`      ✅ Contributor added (Gas used: ${receipt.gasUsed})`);
            contributorsAdded++;
          } catch (err) {
            // If contributor already exists, skip without incrementing nonce
            if (err.message && (err.message.includes("already exists") || err.reason?.includes("already exists"))) {
              console.log(`      ℹ️ Contributor already exists on blockchain, skipping (no TX sent)`);
              contributorsAdded++;
            } else if (err.message && err.message.includes("Total percentage exceeds")) {
              // This means other contributors have already been added and the percentages don't match
              // Skip this contributor since the blockchain already has a different configuration
              console.log(`      ⚠️ Percentage conflict with existing contributors - skipping (no TX sent)`);
              contributorsAdded++;
            } else {
              // Real error - don't increment nonce, re-throw
              console.error(`      ❌ Error adding contributor: ${err.message}`);
              throw err;
            }
          }
        } catch (err) {
          console.error(`      ❌ Outer error: ${err.message}`);
          throw err;
        }
      }

      console.log(`   ✅ Successfully synced ${contributorsAdded} contributors`);

      // Now distribute rewards using the correct blockchain ID
      console.log(`   💸 Calling distributeRewardsBatch with blockchainId: ${blockchainId}, rewardPool: ${rewardPool} MLDT`);
      console.log(`   📊 Parameters: dataId=${blockchainId}, rewardPool=${ethers.parseEther(rewardPool.toString()).toString()}`);
      console.log(`   📍 Using nonce: ${currentNonce}`);
      
      let tx;
      try {
        // Call contract method with explicit error handling and nonce
        const populatedTx = await contract.distributeRewardsBatch.populateTransaction(
          blockchainId,
          ethers.parseEther(rewardPool.toString())
        );
        
        console.log(`   📝 Transaction data: ${populatedTx.data.substring(0, 70)}...`);
        
        tx = await contract.distributeRewardsBatch(
          blockchainId,
          ethers.parseEther(rewardPool.toString()),
          { nonce: currentNonce }
        );
        
        currentNonce++; // Increment nonce for any future transactions
        console.log(`   ✅ distributeRewardsBatch call successful`);
      } catch (err) {
        console.error(`   ❌ Error calling distributeRewardsBatch:`);
        console.error(`      Message: ${err.message}`);
        console.error(`      Code: ${err.code}`);
        if (err.data) {
          console.error(`      Error data: ${err.data}`);
        }
        if (err.reason) {
          console.error(`      Reason: ${err.reason}`);
        }
        if (err.revert) {
          console.error(`      Revert: `, err.revert);
        }
        
        // Try to decode error manually
        if (err.data && err.data.startsWith('0x08c379a0')) {
          // Standard Error(string) revert
          try {
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            const decoded = abiCoder.decode(['string'], '0x' + err.data.substring(10));
            console.error(`      Decoded error: ${decoded[0]}`);
          } catch (e) {
            console.error(`      Could not decode error`);
          }
        }
        
        throw err;
      }

      console.log(`   Transaction: ${tx.hash}`);

      // Update local database with total rewards
      // Note: We don't update totalReward here because smart contract is the source of truth
      // Frontend will fetch correct data from blockchain after distribution
      const db = readDB();
      const datasetIndex = db.datasets.findIndex(d => d.id === parseInt(datasetId));
      if (datasetIndex !== -1) {
        if (!db.datasets[datasetIndex].royalty) {
          db.datasets[datasetIndex].royalty = { contributors: [] };
        }

        // Just mark that distribution happened, but don't double-count totalReward
        // The actual totalReward is tracked by the smart contract
        console.log(`   💾 Database updated (smart contract tracks actual totalReward)`);
        writeDB(db);
      }

      console.log(`✅ [ROYALTY] Distributed ${rewardPool} MLDT to ${dataset.royalty.contributors.length} contributors`);

      return res.json({
        success: true,
        message: `Successfully distributed ${rewardPool} MLDT`,
        transactionHash: tx.hash,
        blockchainId: blockchainId,
        registered: needsRegistration,
        distributedCount: dataset.royalty.contributors.length,
        totalAmount: rewardPool
      });
    } catch (blockchainErr) {
      console.error("❌ Blockchain error:", blockchainErr);
      return res.status(500).json({ 
        error: `Blockchain error: ${blockchainErr.message}` 
      });
    }
  } catch (err) {
    console.error("❌ Error distributing rewards:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
