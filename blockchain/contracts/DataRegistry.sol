// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function mintReward(address to, uint256 amount) external;
}

contract DataRegistry {
    address public tokenAddress;
    IERC20 public mlDataToken;
    struct DataInfo {
        address owner;
        string hash;
        uint256 timestamp;
        string datasetName;
        string description;
        string dataType;
        uint256 fileSize;
        string license;
    }

    struct Version {
        string version;           // "1.0", "1.1", "2.0"
        string hash;              // Hash của version này
        uint256 timestamp;        // Khi version được tạo
        address updatedBy;        // Ai update version này
        string changeLog;         // Mô tả thay đổi
    }

    struct Contributor {
        address addr;             // Wallet address
        uint256 percentage;       // Tỷ lệ đóng góp (0-100)
        uint256 totalReward;      // Tổng reward đã nhận
        uint256 joinedAt;         // Thời gian tham gia
    }

    struct ModelUsage {
        address trainer;          // Người training
        string modelType;         // Loại model
        uint256 accuracy;         // Accuracy (0-100 hoặc 0-10000 để 2 decimals)
        uint256 timestamp;        // Thời gian training
        uint256 rewardPool;       // Tổng reward từ model này
    }

    DataInfo[] public dataList;
    
    // Mapping: dataId => array of versions
    mapping(uint256 => Version[]) public dataVersions;
    
    // Mapping: dataId => array of contributors
    mapping(uint256 => Contributor[]) public dataContributors;
    
    // Mapping: dataId => array of model usages
    mapping(uint256 => ModelUsage[]) public modelUsages;

    event DataRegistered(
        uint indexed id,
        address indexed owner,
        string hash,
        uint256 timestamp,
        string datasetName,
        string dataType
    );

    event VersionCreated(
        uint indexed dataId,
        string version,
        address indexed updatedBy,
        string changeLog,
        uint256 timestamp
    );

    event ContributorAdded(
        uint indexed dataId,
        address indexed contributor,
        uint256 percentage,
        uint256 timestamp
    );

    event ModelUsageRecorded(
        uint indexed dataId,
        address indexed trainer,
        string modelType,
        uint256 accuracy,
        uint256 rewardPool,
        uint256 timestamp
    );

    event RewardDistributed(
        uint indexed dataId,
        address indexed contributor,
        uint256 amount,
        uint256 timestamp
    );

    event TokenAddressSet(address indexed newTokenAddress);

    /**
     * @dev Constructor - initialize with token address
     */
    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        tokenAddress = _tokenAddress;
        mlDataToken = IERC20(_tokenAddress);
    }

    /**
     * @dev Set token address (in case of token migration)
     */
    function setTokenAddress(address _newTokenAddress) external {
        require(_newTokenAddress != address(0), "Invalid token address");
        tokenAddress = _newTokenAddress;
        mlDataToken = IERC20(_newTokenAddress);
        emit TokenAddressSet(_newTokenAddress);
    }

    function registerData(
        string calldata _hash,
        string calldata _datasetName,
        string calldata _description,
        string calldata _dataType,
        uint256 _fileSize,
        string calldata _license
    ) external {
        DataInfo memory d = DataInfo({
            owner: msg.sender,
            hash: _hash,
            timestamp: block.timestamp,
            datasetName: _datasetName,
            description: _description,
            dataType: _dataType,
            fileSize: _fileSize,
            license: _license
        });

        dataList.push(d);

        emit DataRegistered(
            dataList.length - 1,
            msg.sender,
            _hash,
            block.timestamp,
            _datasetName,
            _dataType
        );
    }

    function getData(uint256 _id)
        public
        view
        returns (
            address,
            string memory,
            uint256,
            string memory,
            string memory,
            string memory,
            uint256,
            string memory
        )
    {
        DataInfo storage d = dataList[_id];
        return (
            d.owner,
            d.hash,
            d.timestamp,
            d.datasetName,
            d.description,
            d.dataType,
            d.fileSize,
            d.license
        );
    }

    function count() public view returns (uint256) {
        return dataList.length;
    }

    /**
     * Tạo version mới cho dataset
     * Chỉ owner của dataset mới có thể tạo version
     */
    function createVersion(
        uint256 _dataId,
        string calldata _version,
        string calldata _hash,
        string calldata _changeLog
    ) external {
        require(_dataId < dataList.length, "Invalid data ID");
        require(dataList[_dataId].owner == msg.sender, "Only owner can create version");
        
        Version memory v = Version({
            version: _version,
            hash: _hash,
            timestamp: block.timestamp,
            updatedBy: msg.sender,
            changeLog: _changeLog
        });
        
        dataVersions[_dataId].push(v);
        
        emit VersionCreated(
            _dataId,
            _version,
            msg.sender,
            _changeLog,
            block.timestamp
        );
    }

    /**
     * Lấy lịch sử version của dataset
     */
    function getVersionHistory(uint256 _dataId)
        public
        view
        returns (Version[] memory)
    {
        require(_dataId < dataList.length, "Invalid data ID");
        return dataVersions[_dataId];
    }

    /**
     * Lấy số lượng version
     */
    function getVersionCount(uint256 _dataId)
        public
        view
        returns (uint256)
    {
        require(_dataId < dataList.length, "Invalid data ID");
        return dataVersions[_dataId].length;
    }

    /**
     * Lấy version cụ thể
     */
    function getVersion(uint256 _dataId, uint256 _versionIndex)
        public
        view
        returns (
            string memory,
            string memory,
            uint256,
            address,
            string memory
        )
    {
        require(_dataId < dataList.length, "Invalid data ID");
        require(_versionIndex < dataVersions[_dataId].length, "Invalid version index");
        
        Version storage v = dataVersions[_dataId][_versionIndex];
        return (
            v.version,
            v.hash,
            v.timestamp,
            v.updatedBy,
            v.changeLog
        );
    }

    /**
     * ==================== ROYALTY FUNCTIONS ====================
     */

    /**
     * Thêm contributor với tỷ lệ đóng góp
     * Chỉ owner mới có thể gọi
     */
    function addContributor(
        uint256 _dataId,
        address _contributor,
        uint256 _percentage
    ) external {
        require(_dataId < dataList.length, "Invalid data ID");
        require(dataList[_dataId].owner == msg.sender, "Only owner can add contributors");
        require(_percentage > 0 && _percentage <= 100, "Percentage must be between 1 and 100");
        require(_contributor != address(0), "Invalid contributor address");

        Contributor[] storage contributors = dataContributors[_dataId];

        // Check duplicate
        for (uint i = 0; i < contributors.length; i++) {
            require(contributors[i].addr != _contributor, "Contributor already exists");
        }

        // Calculate total percentage of existing contributors
        uint256 totalPercentage = 0;
        for (uint i = 0; i < contributors.length; i++) {
            totalPercentage += contributors[i].percentage;
        }

        // Check if adding this contributor would exceed 100%
        require(totalPercentage + _percentage <= 100, "Total percentage exceeds 100%");

        contributors.push(Contributor({
            addr: _contributor,
            percentage: _percentage,
            totalReward: 0,
            joinedAt: block.timestamp
        }));

        emit ContributorAdded(_dataId, _contributor, _percentage, block.timestamp);
    }

    /**
     * Lấy danh sách contributors của dataset
     */
    function getContributors(uint256 _dataId)
        external
        view
        returns (Contributor[] memory)
    {
        require(_dataId < dataList.length, "Invalid data ID");
        return dataContributors[_dataId];
    }

    /**
     * Ghi nhận việc sử dụng dataset để train model
     * Backend sẽ gọi hàm này
     */
    function recordModelUsage(
        uint256 _dataId,
        address _trainer,
        string calldata _modelType,
        uint256 _accuracy,
        uint256 _rewardPool
    ) external {
        require(_dataId < dataList.length, "Invalid data ID");
        require(_accuracy <= 10000, "Accuracy should be 0-10000 (representing 0-100%)");

        modelUsages[_dataId].push(ModelUsage({
            trainer: _trainer,
            modelType: _modelType,
            accuracy: _accuracy,
            timestamp: block.timestamp,
            rewardPool: _rewardPool
        }));

        emit ModelUsageRecorded(_dataId, _trainer, _modelType, _accuracy, _rewardPool, block.timestamp);
    }

    /**
     * Tính toán reward cho mỗi contributor
     * Theo công thức: contributor_reward = reward_pool * (percentage / 100)
     */
    function calculateRewards(uint256 _dataId, uint256 _rewardPool)
        external
        view
        returns (address[] memory contributors, uint256[] memory rewards)
    {
        require(_dataId < dataList.length, "Invalid data ID");

        Contributor[] storage dataContributors_local = dataContributors[_dataId];
        uint256 length = dataContributors_local.length;

        address[] memory contributorAddrs = new address[](length);
        uint256[] memory rewardAmounts = new uint256[](length);

        for (uint i = 0; i < length; i++) {
            contributorAddrs[i] = dataContributors_local[i].addr;
            rewardAmounts[i] = (_rewardPool * dataContributors_local[i].percentage) / 100;
        }

        return (contributorAddrs, rewardAmounts);
    }

    /**
     * Cập nhật reward cho contributor
     * Gọi token contract để mint và transfer token thực
     */
    function updateContributorReward(
        uint256 _dataId,
        address _contributor,
        uint256 _amount
    ) external {
        require(_dataId < dataList.length, "Invalid data ID");
        require(dataList[_dataId].owner == msg.sender, "Only owner can update rewards");
        require(_amount > 0, "Reward amount must be greater than 0");

        Contributor[] storage contributors = dataContributors[_dataId];
        for (uint i = 0; i < contributors.length; i++) {
            if (contributors[i].addr == _contributor) {
                contributors[i].totalReward += _amount;
                
                // Mint token rewards
                mlDataToken.mintReward(_contributor, _amount);
                
                emit RewardDistributed(_dataId, _contributor, _amount, block.timestamp);
                return;
            }
        }

        revert("Contributor not found");
    }

    /**
     * Distribute rewards batch để tiết kiệm gas
     * Tính toán và transfer reward cho tất cả contributors một lần
     */
    function distributeRewardsBatch(
        uint256 _dataId,
        uint256 _rewardPool
    ) external {
        require(_dataId < dataList.length, "Invalid data ID");
        require(dataList[_dataId].owner == msg.sender, "Only owner can distribute rewards");
        require(_rewardPool > 0, "Reward pool must be greater than 0");

        Contributor[] storage contributors = dataContributors[_dataId];
        
        for (uint i = 0; i < contributors.length; i++) {
            uint256 rewardAmount = (_rewardPool * contributors[i].percentage) / 100;
            if (rewardAmount > 0) {
                contributors[i].totalReward += rewardAmount;
                mlDataToken.mintReward(contributors[i].addr, rewardAmount);
                emit RewardDistributed(_dataId, contributors[i].addr, rewardAmount, block.timestamp);
            }
        }
    }

    /**
     * Lấy lịch sử sử dụng dataset (model training)
     */
    function getModelUsageHistory(uint256 _dataId)
        external
        view
        returns (ModelUsage[] memory)
    {
        require(_dataId < dataList.length, "Invalid data ID");
        return modelUsages[_dataId];
    }
}
