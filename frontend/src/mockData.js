// Sample data so the UI works before the backend supports filters and uploads.
// Replace with real API responses by setting VITE_USE_MOCK=false.

export const COURSES = [
  { code: "UCS301", name: "Data Structures" },
  { code: "UCS310", name: "Database Management Systems" },
  { code: "UCS414", name: "Computer Networks" },
  { code: "UCS503", name: "Software Engineering" },
  { code: "UCS531", name: "Cloud Computing" },
];

export const SEMESTERS = ["Semester 3", "Semester 4", "Semester 5", "Semester 6"];

export const TYPES = ["Lecture notes", "Question paper", "Textbook", "Lab manual"];

export const MOCK_DOCS = [
  {
    id: "d1",
    title: "Introduction to Cloud Service Models: IaaS, PaaS and SaaS",
    course: "UCS531",
    semester: "Semester 5",
    type: "Lecture notes",
    pages: 24,
    body: "Cloud computing delivers computing resources over the internet. The three service models are infrastructure as a service, platform as a service and software as a service. Virtual machines on EC2 are a typical example of infrastructure, while managed databases such as DynamoDB sit closer to the platform layer.",
  },
  {
    id: "d2",
    title: "Amazon S3 and Object Storage Fundamentals",
    course: "UCS531",
    semester: "Semester 5",
    type: "Lecture notes",
    pages: 18,
    body: "Object storage keeps data as objects inside buckets. S3 provides durability, versioning and pre-signed URLs for time-limited access. Storage classes let you balance cost against retrieval speed for archival and frequently used files.",
  },
  {
    id: "d3",
    title: "DynamoDB Data Modelling: Partition Keys and Single-Table Design",
    course: "UCS531",
    semester: "Semester 5",
    type: "Textbook",
    pages: 42,
    body: "DynamoDB is a key-value and document database that scales horizontally. Choosing a partition key that spreads traffic evenly is the most important design decision. Single-table design stores several entity types together and uses sort keys to support multiple access patterns.",
  },
  {
    id: "d4",
    title: "Normalization: 1NF to BCNF with Worked Examples",
    course: "UCS310",
    semester: "Semester 4",
    type: "Lecture notes",
    pages: 31,
    body: "Normalization removes redundancy from relational schemas. A relation is in first normal form when every attribute is atomic. Second and third normal form remove partial and transitive dependencies, and Boyce-Codd normal form requires every determinant to be a candidate key.",
  },
  {
    id: "d5",
    title: "DBMS End Semester Examination 2024",
    course: "UCS310",
    semester: "Semester 4",
    type: "Question paper",
    pages: 4,
    body: "Attempt all questions. Explain transaction isolation levels with examples. Normalize the given relation up to third normal form. Write SQL queries using joins and aggregate functions on the supplied schema.",
  },
  {
    id: "d6",
    title: "Deadlock Detection, Prevention and Recovery",
    course: "UCS503",
    semester: "Semester 5",
    type: "Lecture notes",
    pages: 16,
    body: "A deadlock occurs when processes wait for each other in a cycle. The four necessary conditions are mutual exclusion, hold and wait, no preemption and circular wait. Prevention breaks one condition, while detection builds a wait-for graph and recovers by terminating or rolling back processes.",
  },
  {
    id: "d7",
    title: "Binary Search Trees and Balanced Trees",
    course: "UCS301",
    semester: "Semester 3",
    type: "Textbook",
    pages: 58,
    body: "A binary search tree keeps keys ordered so lookups take time proportional to the height. Rotations in AVL and red-black trees keep the height logarithmic, which guarantees efficient search, insertion and deletion.",
  },
  {
    id: "d8",
    title: "TCP Congestion Control and the Transport Layer",
    course: "UCS414",
    semester: "Semester 6",
    type: "Lecture notes",
    pages: 22,
    body: "TCP provides reliable delivery using acknowledgements and retransmissions. Congestion control adjusts the sending rate with slow start, congestion avoidance and fast recovery to keep the network from collapsing under load.",
  },
  {
    id: "d9",
    title: "Cloud Computing Lab: Deploying a Node.js App on EC2",
    course: "UCS531",
    semester: "Semester 5",
    type: "Lab manual",
    pages: 12,
    body: "Launch an EC2 instance, configure the security group to allow HTTP traffic, install Node.js and run the Express server with a process manager. Attach an IAM role so the application can read and write to S3 without storing credentials.",
  },
  {
    id: "d10",
    title: "Agile Methodologies and Scrum Roles",
    course: "UCS503",
    semester: "Semester 5",
    type: "Lecture notes",
    pages: 14,
    body: "Agile development delivers software in short iterations. Scrum defines the product owner, scrum master and development team, with sprint planning, daily stand-ups, reviews and retrospectives that keep the team aligned.",
  },
];
