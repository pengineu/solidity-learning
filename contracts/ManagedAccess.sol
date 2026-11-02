// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract ManagedAccess {
    address public owner;
    address public manager;
    address[3] public managers;                     //assignment 3-1: 3명 이상의 manager

    mapping(address => bool) public isConfirmed;    //confirm을 관리하는 mapping

    constructor(address _owner, address _manager) {
        owner = _owner;
        manager = _manager;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not authorized");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "You are not authorized to manage this contract");
        _;
    }
    

    modifier onlyAllConfirmed() {
        require(        //assignment 3-2: manager가 아닌 주소로부터 발생한 transaction은 "You are not a manager" 에러메시지 발생 (require 사용)
            msg.sender == manager || msg.sender == managers[0] || msg.sender == managers[1] || msg.sender == managers[2],
            "You are not a manager"
            );
        require(        //assignment 3-2: 모든 manager가 confirm하지 않은 상황에서는 "Not all confirmed yet" 에러메시지 발생(require 사용)
            isConfirmed[manager] && isConfirmed[managers[0]] && isConfirmed[managers[1]] && isConfirmed[managers[2]],
            "Not all confirmed yet" 
            );
        _;
    }

    //confirmation 기능 구현
    function confirm() external {
        require(
            msg.sender == manager || msg.sender == managers[0] || msg.sender == managers[1] || msg.sender == managers[2], 
            "You are not a manager"
        );
        isConfirmed[msg.sender] = true;
    }

    //managers를 set하는 기능 구현
    function setManagers(address _manager1, address _manager2, address _manager3) external onlyOwner {
        managers = [_manager1, _manager2, _manager3];
        for (uint256 i = 0; i < 3; i++) {
            isConfirmed[managers[i]] = false;
        }
    }
}