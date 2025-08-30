// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GrievanceSLA
 * @dev Smart contract for enforcing Service Level Agreements (SLA) in grievance redressal system
 * This contract ensures timely resolution of grievances and provides transparency
 */
contract GrievanceSLA is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Structs
    struct Grievance {
        uint256 id;
        string referenceId;
        address submitter;
        string title;
        string description;
        string category;
        uint256 submissionTime;
        uint256 deadline;
        uint256 resolutionTime;
        GrievanceStatus status;
        uint256 priority;
        bool isResolved;
        bool isEscalated;
        uint256 escalationLevel;
    }

    struct SLAConfig {
        uint256 lowPriorityDeadline;      // 7 days in seconds
        uint256 mediumPriorityDeadline;   // 5 days in seconds
        uint256 highPriorityDeadline;     // 3 days in seconds
        uint256 criticalPriorityDeadline; // 1 day in seconds
        uint256 escalationDeadline;       // 2 days in seconds
        uint256 penaltyAmount;            // Penalty in wei for SLA violation
    }

    struct Escalation {
        uint256 grievanceId;
        uint256 escalationTime;
        address escalatedTo;
        string reason;
        bool isResolved;
    }

    // Enums
    enum GrievanceStatus { 
        Submitted, 
        UnderReview, 
        InProgress, 
        Resolved, 
        Escalated, 
        Closed 
    }

    enum Priority { 
        Low, 
        Medium, 
        High, 
        Critical 
    }

    // State variables
    Counters.Counter private _grievanceIds;
    Counters.Counter private _escalationIds;

    mapping(uint256 => Grievance) public grievances;
    mapping(string => uint256) public referenceIdToGrievanceId;
    mapping(address => uint256[]) public userGrievances;
    mapping(uint256 => Escalation[]) public grievanceEscalations;
    mapping(address => bool) public authorizedOfficers;
    mapping(address => uint256) public officerPerformance;

    SLAConfig public slaConfig;

    // Events
    event GrievanceSubmitted(
        uint256 indexed grievanceId,
        string referenceId,
        address indexed submitter,
        string title,
        string category,
        uint256 priority,
        uint256 deadline
    );

    event GrievanceStatusUpdated(
        uint256 indexed grievanceId,
        GrievanceStatus oldStatus,
        GrievanceStatus newStatus,
        address indexed officer
    );

    event GrievanceResolved(
        uint256 indexed grievanceId,
        address indexed officer,
        uint256 resolutionTime,
        bool slaMet
    );

    event GrievanceEscalated(
        uint256 indexed grievanceId,
        uint256 escalationLevel,
        address escalatedTo,
        string reason
    );

    event SLAViolation(
        uint256 indexed grievanceId,
        uint256 deadline,
        uint256 actualTime,
        uint256 penaltyAmount
    );

    event OfficerAuthorized(address indexed officer, bool authorized);
    event SLAConfigUpdated(SLAConfig newConfig);

    // Modifiers
    modifier onlyAuthorizedOfficer() {
        require(authorizedOfficers[msg.sender], "Not authorized officer");
        _;
    }

    modifier grievanceExists(uint256 grievanceId) {
        require(grievances[grievanceId].id != 0, "Grievance does not exist");
        _;
    }

    modifier notResolved(uint256 grievanceId) {
        require(!grievances[grievanceId].isResolved, "Grievance already resolved");
        _;
    }

    // Constructor
    constructor() {
        // Initialize SLA configuration
        slaConfig = SLAConfig({
            lowPriorityDeadline: 7 days,
            mediumPriorityDeadline: 5 days,
            highPriorityDeadline: 3 days,
            criticalPriorityDeadline: 1 days,
            escalationDeadline: 2 days,
            penaltyAmount: 0.01 ether
        });

        // Authorize the contract owner as the first officer
        authorizedOfficers[msg.sender] = true;
    }

    /**
     * @dev Submit a new grievance
     * @param referenceId Unique reference ID for the grievance
     * @param title Title of the grievance
     * @param description Detailed description
     * @param category Category of the grievance
     * @param priority Priority level (0=Low, 1=Medium, 2=High, 3=Critical)
     */
    function submitGrievance(
        string memory referenceId,
        string memory title,
        string memory description,
        string memory category,
        Priority priority
    ) external {
        require(bytes(referenceId).length > 0, "Reference ID cannot be empty");
        require(referenceIdToGrievanceId[referenceId] == 0, "Reference ID already exists");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

        _grievanceIds.increment();
        uint256 grievanceId = _grievanceIds.current();

        uint256 deadline = block.timestamp + getDeadlineForPriority(priority);

        Grievance memory newGrievance = Grievance({
            id: grievanceId,
            referenceId: referenceId,
            submitter: msg.sender,
            title: title,
            description: description,
            category: category,
            submissionTime: block.timestamp,
            deadline: deadline,
            resolutionTime: 0,
            status: GrievanceStatus.Submitted,
            priority: uint256(priority),
            isResolved: false,
            isEscalated: false,
            escalationLevel: 0
        });

        grievances[grievanceId] = newGrievance;
        referenceIdToGrievanceId[referenceId] = grievanceId;
        userGrievances[msg.sender].push(grievanceId);

        emit GrievanceSubmitted(
            grievanceId,
            referenceId,
            msg.sender,
            title,
            category,
            uint256(priority),
            deadline
        );
    }

    /**
     * @dev Update grievance status (only authorized officers)
     * @param grievanceId ID of the grievance
     * @param newStatus New status to set
     */
    function updateGrievanceStatus(
        uint256 grievanceId,
        GrievanceStatus newStatus
    ) external onlyAuthorizedOfficer grievanceExists(grievanceId) notResolved(grievanceId) {
        Grievance storage grievance = grievances[grievanceId];
        GrievanceStatus oldStatus = grievance.status;
        
        grievance.status = newStatus;

        // If resolved, set resolution time and check SLA
        if (newStatus == GrievanceStatus.Resolved) {
            grievance.resolutionTime = block.timestamp;
            grievance.isResolved = true;
            
            bool slaMet = checkSLAMet(grievanceId);
            if (!slaMet) {
                handleSLAViolation(grievanceId);
            }

            emit GrievanceResolved(grievanceId, msg.sender, block.timestamp, slaMet);
        }

        emit GrievanceStatusUpdated(grievanceId, oldStatus, newStatus, msg.sender);
    }

    /**
     * @dev Escalate a grievance
     * @param grievanceId ID of the grievance
     * @param reason Reason for escalation
     * @param escalatedTo Address of the officer to escalate to
     */
    function escalateGrievance(
        uint256 grievanceId,
        string memory reason,
        address escalatedTo
    ) external onlyAuthorizedOfficer grievanceExists(grievanceId) notResolved(grievanceId) {
        require(authorizedOfficers[escalatedTo], "Target officer not authorized");
        require(escalatedTo != msg.sender, "Cannot escalate to self");

        Grievance storage grievance = grievances[grievanceId];
        grievance.isEscalated = true;
        grievance.escalationLevel++;
        grievance.status = GrievanceStatus.Escalated;

        Escalation memory escalation = Escalation({
            grievanceId: grievanceId,
            escalationTime: block.timestamp,
            escalatedTo: escalatedTo,
            reason: reason,
            isResolved: false
        });

        grievanceEscalations[grievanceId].push(escalation);

        emit GrievanceEscalated(grievanceId, grievance.escalationLevel, escalatedTo, reason);
    }

    /**
     * @dev Check if SLA is met for a grievance
     * @param grievanceId ID of the grievance
     * @return bool True if SLA is met
     */
    function checkSLAMet(uint256 grievanceId) public view grievanceExists(grievanceId) returns (bool) {
        Grievance memory grievance = grievances[grievanceId];
        if (!grievance.isResolved) return false;
        
        return grievance.resolutionTime <= grievance.deadline;
    }

    /**
     * @dev Get deadline for a priority level
     * @param priority Priority level
     * @return uint256 Deadline in seconds from submission
     */
    function getDeadlineForPriority(Priority priority) public view returns (uint256) {
        if (priority == Priority.Low) return slaConfig.lowPriorityDeadline;
        if (priority == Priority.Medium) return slaConfig.mediumPriorityDeadline;
        if (priority == Priority.High) return slaConfig.highPriorityDeadline;
        if (priority == Priority.Critical) return slaConfig.criticalPriorityDeadline;
        return slaConfig.mediumPriorityDeadline; // Default
    }

    /**
     * @dev Handle SLA violation
     * @param grievanceId ID of the grievance
     */
    function handleSLAViolation(uint256 grievanceId) internal {
        Grievance memory grievance = grievances[grievanceId];
        uint256 actualTime = grievance.resolutionTime - grievance.submissionTime;
        uint256 overdueTime = actualTime - (grievance.deadline - grievance.submissionTime);

        emit SLAViolation(grievanceId, grievance.deadline, grievance.resolutionTime, slaConfig.penaltyAmount);
        
        // In a real implementation, you might want to:
        // 1. Deduct penalty from officer's performance score
        // 2. Automatically escalate the grievance
        // 3. Notify higher authorities
    }

    /**
     * @dev Get grievance details
     * @param grievanceId ID of the grievance
     * @return Grievance memory Grievance details
     */
    function getGrievance(uint256 grievanceId) external view grievanceExists(grievanceId) returns (Grievance memory) {
        return grievances[grievanceId];
    }

    /**
     * @dev Get grievance by reference ID
     * @param referenceId Reference ID
     * @return Grievance memory Grievance details
     */
    function getGrievanceByReferenceId(string memory referenceId) external view returns (Grievance memory) {
        uint256 grievanceId = referenceIdToGrievanceId[referenceId];
        require(grievanceId != 0, "Grievance not found");
        return grievances[grievanceId];
    }

    /**
     * @dev Get user's grievances
     * @param user Address of the user
     * @return uint256[] Array of grievance IDs
     */
    function getUserGrievances(address user) external view returns (uint256[] memory) {
        return userGrievances[user];
    }

    /**
     * @dev Get escalations for a grievance
     * @param grievanceId ID of the grievance
     * @return Escalation[] memory Array of escalations
     */
    function getGrievanceEscalations(uint256 grievanceId) external view grievanceExists(grievanceId) returns (Escalation[] memory) {
        return grievanceEscalations[grievanceId];
    }

    // Admin functions
    /**
     * @dev Authorize or deauthorize an officer
     * @param officer Address of the officer
     * @param authorized Whether to authorize or not
     */
    function setOfficerAuthorization(address officer, bool authorized) external onlyOwner {
        authorizedOfficers[officer] = authorized;
        emit OfficerAuthorized(officer, authorized);
    }

    /**
     * @dev Update SLA configuration
     * @param newConfig New SLA configuration
     */
    function updateSLAConfig(SLAConfig memory newConfig) external onlyOwner {
        slaConfig = newConfig;
        emit SLAConfigUpdated(newConfig);
    }

    /**
     * @dev Get total number of grievances
     * @return uint256 Total count
     */
    function getTotalGrievances() external view returns (uint256) {
        return _grievanceIds.current();
    }

    /**
     * @dev Check if address is authorized officer
     * @param officer Address to check
     * @return bool True if authorized
     */
    function isAuthorizedOfficer(address officer) external view returns (bool) {
        return authorizedOfficers[officer];
    }
}
