// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AdminBase.sol";
import "./AgentExecutor.sol";

/**
 * @title JobEscrow
 * @notice Route user tasks to agents, track jobs, verify completion
 */
contract JobEscrow is AdminBase {
    enum JobStatus { PENDING, PROCESSING, COMPLETED, FAILED }

    struct Job {
        address user;
        string question;
        string serviceType;
        JobStatus status;
        bytes32 executorJobId;
        bytes resultData;
        uint256 timestamp;
    }

    uint256 public jobCount;
    mapping(uint256 => Job) public jobs;
    AgentExecutor public executor;

    event JobCreated(uint256 indexed jobId, address indexed user, string serviceType);
    event JobCompleted(uint256 indexed jobId, bytes32 executorJobId, bytes result);
    event JobFailed(uint256 indexed jobId, string reason);

    constructor(address _executor) {
        executor = AgentExecutor(_executor);
    }

    function createJob(string calldata question, string calldata serviceType) external whenNotPaused returns (uint256) {
        jobCount++;
        uint256 jobId = jobCount;
        jobs[jobId] = Job({
            user: msg.sender,
            question: question,
            serviceType: serviceType,
            status: JobStatus.PROCESSING,
            executorJobId: bytes32(0),
            resultData: bytes(""),
            timestamp: block.timestamp
        });

        // Trigger HTTP fetch via executor
        bytes32 exeJobId = executor.fetchHTTP(question);
        jobs[jobId].executorJobId = exeJobId;

        emit JobCreated(jobId, msg.sender, serviceType);
        return jobId;
    }

    function completeJob(uint256 jobId, bytes32 executorJobId) external {
        Job storage job = jobs[jobId];
        require(job.executorJobId == executorJobId, "Wrong job ID");
        require(executor.completedJobs(executorJobId), "Not completed");

        job.resultData = executor.getResult(executorJobId);
        job.status = JobStatus.COMPLETED;
        emit JobCompleted(jobId, executorJobId, job.resultData);
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getRecentJobs(uint256 limit) external view returns (Job[] memory) {
        uint256 start = jobCount > limit ? jobCount - limit + 1 : 1;
        uint256 len = jobCount - start + 1;
        Job[] memory result = new Job[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = jobs[start + i];
        }
        return result;
    }
}
