const express = require("express");
const { ethers } = require("ethers");
const { getDatasetById, readDB, writeDB } = require("../metadataDB");

const router = express.Router();

// Load contract ABI
const DataRegistryABI = require("../DataRegistry.json").abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x...";
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";

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

    const totalPercentage = royalty.contributors.reduce((sum, c) => sum + c.percentage, 0);

    return res.json({
      success: true,
      datasetId: dataset.id,
      datasetName: dataset.datasetName,
      owner: dataset.ownerAddress,
      contributors: royalty.contributors,
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

module.exports = router;
