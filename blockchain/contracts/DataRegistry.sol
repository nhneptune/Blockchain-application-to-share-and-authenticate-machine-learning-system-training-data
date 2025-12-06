// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataRegistry {
    struct DataInfo {
        address owner;
        string hash;
        uint256 timestamp;
    }

    DataInfo[] public dataList;

    event DataRegistered(
        uint indexed id,
        address indexed owner,
        string hash,
        uint256 timestamp
    );

    function registerData(string calldata _hash) external {
        DataInfo memory d = DataInfo({
            owner: msg.sender,
            hash: _hash,
            timestamp: block.timestamp
        });

        dataList.push(d);

        emit DataRegistered(
            dataList.length - 1,
            msg.sender,
            _hash,
            block.timestamp
        );
    }

    function getData(uint256 _id)
        public
        view
        returns (address, string memory, uint256)
    {
        DataInfo storage d = dataList[_id];
        return (d.owner, d.hash, d.timestamp);
    }

    function count() public view returns (uint256) {
        return dataList.length;
    }
}
