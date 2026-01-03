# Gaps & Next Steps

Based on the initial project specification and the request to add network device scanning, here is a summary of the gaps and a plan for the next steps.

## Gaps

1.  **Limited Scanning Capability:** The current implementation appears to focus on web-based targets (URLs, IPs, domains). It lacks the functionality to perform detailed scans on network hardware like routers and switches from vendors such as Mikrotik, Cisco, Juniper, VSOL, and OLTs.
2.  **Missing Device-Specific Logic:** There is no code to handle the specific protocols (e.g., SNMP, SSH/Telnet CLI) or APIs required to gather information from these network devices.
3.  **Database Schema:** The `Scans` and `Findings` tables in the database may not be structured to handle the variety of information that comes from network device scans (e.g., device model, firmware version, running configuration, interface status).
4.  **Frontend/UI:** The user interface does not have options to select network device scan types or to display the specific results from these scans.

## Next Steps

To address these gaps and implement the requested features, the following steps will be taken:

1.  **[In Progress] Enhance Backend for Network Device Scanning:**
    *   **Research and select libraries:** Identify and integrate Node.js libraries for interacting with network devices using SNMP, SSH, or vendor-specific APIs.
    *   **Create new scanner modules:** Develop new scanner modules in `backend/jobs/` for each device type or a generic one. This will include logic to connect to devices, gather information (like firmware version, configuration, open ports, known vulnerabilities), and process the results.
    *   **Examples of information to gather:**
        *   Device uptime
        *   CPU and memory utilization
        *   List of interfaces and their status
        *   Running configuration details
        *   Firewall rules
        *   Firmware version and checks for updates/vulnerabilities.

2.  **[Pending] Update Database Models:**
    *   Extend the `Scan` model to include a `scanType` (e.g., 'web', 'network_device').
    *   Extend the `Finding` model to store device-specific information.

3.  **[Pending] Update API Endpoints:**
    *   Modify the `/api/scans` endpoint to accept the new `scanType` and target information (e.g., IP address and credentials for the device).
    *   Create new endpoints if necessary for device-specific actions.

4.  **[Pending] Frontend Integration:**
    *   Add new components to the frontend to allow users to select network device scans.
    *   Create new views to display the results from these scans in a user-friendly format.

5.  **[Pending] Documentation:**
    *   Update the `README.md` and other documentation to reflect the new capabilities.
