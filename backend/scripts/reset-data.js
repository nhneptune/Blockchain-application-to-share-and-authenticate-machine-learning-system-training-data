#!/usr/bin/env node

/**
 * Script để xóa toàn bộ dữ liệu local
 * Dùng để test lại cho khách quan
 * 
 * Cách sử dụng:
 * node scripts/reset-data.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const filesToDelete = [
  { path: "metadata.json", desc: "Dữ liệu datasets" },
  { path: "versions.json", desc: "Dữ liệu versioning" },
];

const foldersToDelete = [
  { path: "uploads", desc: "Folder chứa các file đã upload" },
];

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Đã xóa: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  File không tồn tại: ${filePath}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Lỗi khi xóa ${filePath}:`, err.message);
    return false;
  }
}

function deleteFolder(folderPath) {
  try {
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`✅ Đã xóa folder: ${folderPath}`);
      return true;
    } else {
      console.log(`⚠️  Folder không tồn tại: ${folderPath}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Lỗi khi xóa folder ${folderPath}:`, err.message);
    return false;
  }
}

function resetData() {
  console.log("\n========================================");
  console.log("   🗑️  RESET LOCAL DATA");
  console.log("========================================\n");

  console.log("📋 Các dữ liệu sẽ được xóa:");
  filesToDelete.forEach((f) => console.log(`  • ${f.path} - ${f.desc}`));
  foldersToDelete.forEach((f) => console.log(`  • ${f.path}/ - ${f.desc}`));

  console.log("\n⚠️  Chú ý: Hành động này không thể hoàn tác!\n");

  rl.question("Bạn có chắc chắn muốn xóa? (yes/no): ", (answer) => {
    if (answer.toLowerCase() === "yes") {
      console.log("\n🔄 Đang xóa dữ liệu...\n");

      let deletedCount = 0;

      // Xóa files
      filesToDelete.forEach((f) => {
        if (deleteFile(f.path)) deletedCount++;
      });

      // Xóa folders
      foldersToDelete.forEach((f) => {
        if (deleteFolder(f.path)) deletedCount++;
      });

      console.log("\n========================================");
      console.log(`✅ Hoàn thành! Đã xóa ${deletedCount} items`);
      console.log("========================================\n");
    } else {
      console.log("\n❌ Đã hủy bỏ.\n");
    }

    rl.close();
  });
}

resetData();
