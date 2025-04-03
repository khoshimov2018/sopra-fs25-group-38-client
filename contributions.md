# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@notsofun]** | [24/03/2025-26/03/2025]   | [https://github.com/HASEL-UZH/sopra-fs25-template-client/commit/e1eaa784ad2a2663dde5721c789d1ee0e2843caa] | [Implemented framework of Chatting page] | [It is the key feature of our system.] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@Kai3421]** | [24/03/2025-26/03/2025]   | [dce42be4bde09360e9fa9cbb7831968a48cf22c5] | [added MatchGetDTO, MatchPostDTO & adapted DTOMapper for basic matching services] | [Used to find matches] |
|                    | [24/03/2025-26/03/2025]   | [da8e06b223c7a9fb90ec16b4aba2c8432ef386f7] | [added MatchRepo and adjusted Match.java to adhere to logic for matching ] | [logic for creating a match - if User1likedUser2 and vice versa its a match :) ] |
| **[@khoshimov2018]** | [24.03.2025-26.03.2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-client/commit/d4281a1f56c5a717118ba5aa0f960ce3c1e25470#diff-9bc56eaf57b2c5636ab7404b9a18ec957a3aa46345de274effa96074f4646f10] | [I have updated the login and register flows] | [created the login register auth flow] |
|                    | [24.03.2025-26.03.2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-client/commit/f0d3f4e4232e259ec6aa7e69d570df45a2ecab90] | [Cretaed Main page] | [Main page is where users can like and dislike the profiles] |
| **[@darikzmn]** | [24.03.2025-27.03.2025]   | [[https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/b01f0d7e77d6dc2d4183145c66b312d793436d81] | [Implemented user registration and login functionalities using email-based authentication, including secure password hashing and support for extended profile fields.] | [It fulfills the backend requirements of User Stories S1 (Registration) and S2 (Login).] |
|                    | [24.03.2025-27.03.2025]   | [[https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/a134124d76d856b0cf0ee41048057834e38ec8f9] | [Added logout functionality for users via POST /users/logout endpoint and implemented corresponding service method to update user status to OFFLINE.] | [It fulfills the backend requirements of User Story S3 (Logout).] |
|                    | [24.03.2025-27.03.2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/b672fd843aa2b4180e30d5d5fa906f5cb60a65d1] | [Added bio, updated fields and validation in UserPostDTO, DTOMapper and UserService for profile editing.] | [It fulfills the backend requirements of User Story S4 (Profile editing).] |
| **[@RomanticSilence]** | [24/03/2025-24/03/2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/actions/runs/14034771907] | [create the User entity, merge the profile attr.] | [keeping the same data structure is very important for backend development] |
|                    | [24/03/2025-25/03/2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/actions/runs/14038394598] | [implement and refine all data schema(class)] | [Having the same data schema is essential, and should be implemented first, also part of the previous class UML class doesn't fit expectation, so it need to be refined] |
| **[@AjeongShin]** | [25/03/2025-26/03/2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/4b4f26c6359cb7c6ba7e0283067fdb0ca012143e] | [edited Course entity, added DTO and mapping logic, and implemented GET /courses endpoint to expose course list] | [Established the base structure to provide a consistent course list to the frontend and enable course-based user filtering] |
|                    | [27/03/2025-27/03/2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/4b4f26c6359cb7c6ba7e0283067fdb0ca012143e] | [implemented GET /students filtering by courseIds by adding service logic, and user mapping] | [Enabled course-based user matching by filtering students enrolled in all selected courses, laying the foundation for multi-criteria search.] |

---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@khoshimov2018]** | [30.03.2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-client/commit/eac0d344b7aaf70bcac358adc79ec03868c0bd81] | [Created Profile Page] | [This is where a user can see his profile and can edit page by pressing the button edit page] |
|                    | [03.04.2025]   | [Link to Commit 2] | [Profile Page Edit] | [Users can edit their profile] |
| **[@Kai3421]** | [29.03-03.04]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/7835cc7a9405da079bb06e6a2dacb7d4e5c176bf] | [add match_id for user through join column] | [important to find users with which other users are matched ] |
|                    | [29.03-03.04]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/8da95b4fb9bd7aa255accea987fc3b2679639798] | [added logic to fetch user ids in user service and added missing imports] | [need to fetch user ids for matches] |
|                    | [29.03-03.04]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/764c84736286e79dea1c2d148582cc4276a1a660] | [adjusted logic to only fetch user ids for ACCEPTED matches] | [should only be able to fetch the user ids for ACCEPTED machtes] |
|                    | [29.03-03.04]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/ba94de481e8f82f2e030c8799c16b86de04a1a99] | [adding logic to MatchPostDTO for matching] | [basis in order to match people] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser5]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@AjeongShin]** | [29/03/2025-29/03/2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/29a6ffa0916376b5a8a7c7a002fbb5c32373180b] | [Implement GET /students endpoint with filtering by courseIds or availability] | [Enables flexible backend filtering to support dynamic frontend search features based on course or time availability] |
|                    | [02/04/2025-02/04/2025]   | [https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/507047fb05a8d2f6a44c51d93bff035124fd5ab7] | [Fix server build failure by adding missing @Id annotation to entity] | [Ensures that the application can compile and run successfully with proper JPA configuration] |
|                    | [02/04/2025-02/04/2025]   | [[https://github.com/khoshimov2018/sopra-fs25-group-38-server/commit/5f9cc61295b7568edd962a414334a78639d1fb81] | [Add unit tests for retrieving courses and filtering students by availability] | [Improves test coverage and ensures correct functionality for core GET endpoints] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._