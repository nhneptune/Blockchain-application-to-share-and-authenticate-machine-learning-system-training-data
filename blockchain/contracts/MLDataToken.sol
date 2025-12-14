// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MLDataToken
 * @dev ERC20 token để reward cho contributors trong hệ thống chia sẻ dữ liệu ML
 */
contract MLDataToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    // Địa chỉ của DataRegistry có quyền mint token
    address public dataRegistry;

    // Events
    event DataRegistrySet(address indexed newRegistry);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    constructor(uint256 initialSupply) ERC20("ML Data Token", "MLDT") Ownable(msg.sender) {
        // Mint initial supply cho owner
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Set địa chỉ DataRegistry có quyền mint
     * Chỉ owner mới có thể gọi
     */
    function setDataRegistry(address _dataRegistry) external onlyOwner {
        require(_dataRegistry != address(0), "Invalid address");
        dataRegistry = _dataRegistry;
        emit DataRegistrySet(_dataRegistry);
    }

    /**
     * @dev DataRegistry gọi để mint token cho contributors
     */
    function mintReward(address to, uint256 amount) external {
        require(msg.sender == dataRegistry, "Only DataRegistry can mint");
        require(to != address(0), "Invalid recipient");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Owner mint token trực tiếp
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Internal function to handle transfer logic with pause check
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
