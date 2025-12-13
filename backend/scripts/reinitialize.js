#!/usr/bin/env node

/**
 * Script để reset dữ liệu và khởi tạo lại
 * Xóa dữ liệu cũ và tạo file metadata.json mới với cấu trúc sạch
 * 
 * Cách sử dụng:
 * node scripts/reinitialize.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Lỗi khi xóa ${filePath}:`, err.message);
    return false;
  }
}

function deleteFolder(folderPath) {
  try {
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Lỗi khi xóa folder ${folderPath}:`, err.message);
    return false;
  }
}

function createEmptyMetadata() {
  const emptyMetadata = {
    nextDatasetId: 1,
    datasets: [],
  };

  try {
    fs.writeFileSync(
      "metadata.json",
      JSON.stringify(emptyMetadata, null, 2)
    );
    console.log(`✅ Đã tạo file metadata.json mới`);
    return true;
  } catch (err) {
    console.error(`❌ Lỗi khi tạo metadata.json:`, err.message);
    return false;
  }
}

function createUploadsFolder() {
  try {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
      console.log(`✅ Đã tạo folder uploads/`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Lỗi khi tạo folder uploads/:`, err.message);
    return false;
  }
}

function reinitialize() {
  console.log("\n========================================");
  console.log("   🔄 REINITIALIZE LOCAL DATA");
  console.log("========================================\n");

  console.log("📋 Các hành động sẽ được thực hiện:");
  console.log("  1. Xóa metadata.json");
  console.log("  2. Xóa folder uploads/");
  console.log("  3. Xóa versions.json (nếu có)");
  console.log("  4. Tạo metadata.json mới (rỗng)");
  console.log("  5. Tạo folder uploads/ mới");

  console.log("\n⚠️  Chú ý: Hành động này không thể hoàn tác!\n");

  rl.question("Bạn có chắc chắn muốn reinitialize? (yes/no): ", (answer) => {
    if (answer.toLowerCase() === "yes") {
      console.log("\n🔄 Đang reinitialize...\n");

      // Xóa dữ liệu cũ
      deleteFile("metadata.json");
      deleteFile("versions.json");
      deleteFolder("uploads");

      // Tạo dữ liệu mới
      const metadataCreated = createEmptyMetadata();
      const uploadsCreated = createUploadsFolder();

      console.log("\n========================================");
      if (metadataCreated && uploadsCreated) {
        console.log("✅ Reinitialize thành công!");
        console.log("📊 Metadata mới với nextDatasetId = 1");
        console.log("📁 Folder uploads/ sạch và sẵn sàng");
      } else {
        console.log("⚠️  Reinitialize hoàn thành nhưng có lỗi");
      }
      console.log("========================================\n");
    } else {
      console.log("\n❌ Đã hủy bỏ.\n");
    }

    rl.close();
  });
}

reinitialize();
