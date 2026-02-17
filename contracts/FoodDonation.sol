// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FoodDonation
 * @dev Smart contract for recording food donations to NGOs on the blockchain
 */
contract FoodDonation {
    // Struct to represent a food donation
    struct Donation {
        uint256 donationId;
        address donor;
        address ngoAddress;
        string itemName;
        uint256 timestamp;
        bool isValid;
    }

    // Mapping to store donations by ID
    mapping(uint256 => Donation) public donations;
    
    // Mapping to track donation count per NGO
    mapping(address => uint256) public ngoDonationCount;
    
    // Total number of donations
    uint256 public totalDonations;
    
    // Counter for donation IDs
    uint256 private donationCounter;

    // Event emitted when a donation is made
    event DonationRecorded(
        uint256 indexed donationId,
        address indexed donor,
        address indexed ngoAddress,
        string itemName,
        uint256 timestamp
    );

    /**
     * @dev Record a food donation
     * @param ngoAddress The Ethereum address of the NGO receiving the donation
     * @param itemName The name/description of the food item being donated
     */
    function recordDonation(address ngoAddress, string memory itemName) public {
        require(ngoAddress != address(0), "NGO address cannot be zero");
        require(bytes(itemName).length > 0, "Item name cannot be empty");
        
        donationCounter++;
        
        Donation memory newDonation = Donation({
            donationId: donationCounter,
            donor: msg.sender,
            ngoAddress: ngoAddress,
            itemName: itemName,
            timestamp: block.timestamp,
            isValid: true
        });
        
        donations[donationCounter] = newDonation;
        ngoDonationCount[ngoAddress]++;
        totalDonations++;
        
        emit DonationRecorded(
            donationCounter,
            msg.sender,
            ngoAddress,
            itemName,
            block.timestamp
        );
    }

    /**
     * @dev Record multiple donations in a single transaction
     * @param ngoAddress The Ethereum address of the NGO receiving the donations
     * @param itemNames Array of food item names being donated
     */
    function recordMultipleDonations(address ngoAddress, string[] memory itemNames) public {
        require(ngoAddress != address(0), "NGO address cannot be zero");
        require(itemNames.length > 0, "Must donate at least one item");
        
        for (uint256 i = 0; i < itemNames.length; i++) {
            require(bytes(itemNames[i]).length > 0, "Item name cannot be empty");
            
            donationCounter++;
            
            Donation memory newDonation = Donation({
                donationId: donationCounter,
                donor: msg.sender,
                ngoAddress: ngoAddress,
                itemName: itemNames[i],
                timestamp: block.timestamp,
                isValid: true
            });
            
            donations[donationCounter] = newDonation;
            ngoDonationCount[ngoAddress]++;
            totalDonations++;
            
            emit DonationRecorded(
                donationCounter,
                msg.sender,
                ngoAddress,
                itemNames[i],
                block.timestamp
            );
        }
    }

    /**
     * @dev Get donation details by ID
     * @param donationId The ID of the donation to retrieve
     * @return The donation struct
     */
    function getDonation(uint256 donationId) public view returns (Donation memory) {
        require(donations[donationId].isValid, "Donation does not exist");
        return donations[donationId];
    }

    /**
     * @dev Get total number of donations made by a specific NGO
     * @param ngoAddress The Ethereum address of the NGO
     * @return The count of donations received by the NGO
     */
    function getNGODonationCount(address ngoAddress) public view returns (uint256) {
        return ngoDonationCount[ngoAddress];
    }
}

