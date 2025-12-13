// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataRegistry {
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

    DataInfo[] public dataList;
    
    // Mapping: dataId => array of versions
    mapping(uint256 => Version[]) public dataVersions;

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
}
