const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DataRegistry", function () {
  let DataRegistry, registry, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    DataRegistry = await ethers.getContractFactory("DataRegistry");
    registry = await DataRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("Should register data and increase count", async function () {
    const hash = "Qm123abcHashDemo";

    await registry.connect(addr1).registerData(hash);

    expect(await registry.count()).to.equal(1);
  });

  it("Should store correct owner and hash", async function () {
    const hash = "QmXYZHash";

    await registry.connect(addr1).registerData(hash);

    const data = await registry.getData(0);

    expect(data[0]).to.equal(addr1.address);
    expect(data[1]).to.equal(hash);
    expect(data[2]).to.be.gt(0);  // timestamp > 0
  });

  it("Should emit DataRegistered event", async function () {
    const hash = "QmEmitTest";

    await expect(registry.connect(addr1).registerData(hash))
      .to.emit(registry, "DataRegistered")
      .withArgs(
        0,                 // id
        addr1.address,     // owner
        hash,              // hash
        await ethers.provider.getBlock("latest").then(b => b.timestamp + 1)
      );
  });
});
