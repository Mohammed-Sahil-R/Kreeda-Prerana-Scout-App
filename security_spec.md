# Security Specification - Kreeda-Prerana Scout

## Data Invariants
1. A performance log MUST reference a valid student ID that exists in the database.
2. Only the teacher who created a student profile can read or write their performance logs.
3. Timestamps MUST be server-generated.
4. Test values MUST be positive numbers within realistic ranges (e.g., sprint times between 5s and 60s, jumps between 0m and 10m).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a student with a `teacherId` that doesn't match the current user's UID.
2. **Resource Poisoning**: Create a performance log with a 1MB string as the `studentId`.
3. **Ghost Field Update**: Update a student profile but inject an `isElite: true` field that isn't in the schema.
4. **Relational Bypass**: Create a performance log for a `studentId` that does not exist.
5. **Unauthorized Read**: Attempt to list students where `teacherId` != current user.
6. **Immutable Tampering**: Change the `createdAt` timestamp of a student profile.
7. **Value Poisoning**: Set a sprint time to -10 seconds.
8. **Owner Hijack**: Update the `teacherId` of a student profile to transfer ownership to oneself.
9. **Blanket Query**: Request all students without a `where('teacherId', '==', uid)` filter.
10. **ID Injection**: Create a student with a document ID containing malicious scripts or overly long strings.
11. **Action Shortcut**: Update multiple sensitive fields in a single operation without action-based permissions.
12. **PII Leak**: Access the `students` collection without being authenticated.

## The Test Runner (Mock Logic)
The `firestore.rules` will reject all these payloads by enforcing `isValidId()`, `isValidStudent()`, and relational checks using `get()`.
