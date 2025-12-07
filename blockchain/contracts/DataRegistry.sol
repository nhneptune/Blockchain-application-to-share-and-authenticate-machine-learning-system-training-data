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

    DataInfo[] public dataList;

    event DataRegistered(
        uint indexed id,
        address indexed owner,
        string hash,
        uint256 timestamp,
        string datasetName,
        string dataType
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
}
