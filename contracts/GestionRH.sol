// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GestionRH {
    address public hrAddress;

    struct Employee {
        address walletAddress;
        string name;
        string position;
        uint256 salary;
        bool isRegistered;
    }

    mapping(address => Employee) private employees;
    address[] private employeeAddresses;

    event EmployeeAdded(address indexed walletAddress, string name, string position);

    modifier onlyHR() {
        require(msg.sender == hrAddress, "Access denied: Only HR can perform this action");
        _;
    }

    modifier onlyRegisteredEmployee() {
        require(employees[msg.sender].isRegistered, "Access denied: You are not a registered employee");
        _;
    }

    constructor() {
        hrAddress = msg.sender;
    }

    function addEmployee(address _walletAddress, string memory _name, string memory _position, uint256 _salary) public onlyHR {
        require(!employees[_walletAddress].isRegistered, "Employee is already registered");

        employees[_walletAddress] = Employee({
            walletAddress: _walletAddress,
            name: _name,
            position: _position,
            salary: _salary,
            isRegistered: true
        });

        employeeAddresses.push(_walletAddress);

        emit EmployeeAdded(_walletAddress, _name, _position);
    }

    function getAllEmployees() public view onlyHR returns (Employee[] memory) {
        uint256 employeeCount = employeeAddresses.length;
        Employee[] memory allEmployees = new Employee[](employeeCount);

        for (uint256 i = 0; i < employeeCount; i++) {
            address empAddr = employeeAddresses[i];
            allEmployees[i] = employees[empAddr];
        }

        return allEmployees;
    }

    function getMyInfo() public view onlyRegisteredEmployee returns (Employee memory) {
        return employees[msg.sender];
    }
}
