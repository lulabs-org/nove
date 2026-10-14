# Meeting API Guide

This document provides detailed reference for the `meeting` module API endpoints in the `nove_api` project.

## General Information
- **Base Path:** `/meetings`
- **Authentication:** Bearer Token required (`@ApiBearerAuth()`)
- **ID Format:** Uses CUID format (validated by `CuidPipe`).

## Endpoints Documentation

### 1. Get Meeting Records List
- **Method:** `GET`
- **Path:** `/meetings`
- **Query Parameters:** Supports pagination and filtering (e.g., `startDate`, `endDate`).
- **Description:** Retrieves a paginated list of meeting records.
- **Response:** `MeetingRecordListResponseDto` (contains data array, total, page, limit, totalPages).

### 2. Get Meeting Record Details
- **Method:** `GET`
- **Path:** `/meetings/:id`
- **Path Parameters:** `id` (CUID)
- **Description:** Retrieves details of a specific meeting record.
- **Response:** `MeetingRecordResponseDto`

### 3. Create Meeting Record
- **Method:** `POST`
- **Path:** `/meetings`
- **Body:** `CreateMeetingRecordDto` (requires `platformMeetingId` and other details)
- **Description:** Creates a new meeting record.
- **Response:** `MeetingRecordResponseDto`

### 4. Update Meeting Record
- **Method:** `PUT`
- **Path:** `/meetings/:id`
- **Path Parameters:** `id` (CUID)
- **Body:** `UpdateMeetingRecordDto`
- **Description:** Updates an existing meeting record.
- **Response:** `MeetingRecordResponseDto`

### 5. Delete Meeting Record
- **Method:** `DELETE`
- **Path:** `/meetings/:id`
- **Path Parameters:** `id` (CUID)
- **Description:** Deletes a meeting record.
- **Response:** `DeleteMeetingRecordResponseDto` (contains success flag, deleted record data, deletedAt).

### 6. Get Meeting Statistics Summary
- **Method:** `GET`
- **Path:** `/meetings/stats/summary`
- **Query Parameters:** `startDate` (optional), `endDate` (optional)
- **Description:** Retrieves statistical summary of meetings within the specified date range.
- **Response:** `MeetingStatsResponseDto`

### 7. Get Recording Transcript
- **Method:** `GET`
- **Path:** `/recordings/:id/transcript`
- **Path Parameters:** `id` (CUID)
- **Query Parameters:** `format` (optional, `'text'` or `'json'`)
- **Description:** Retrieves the transcript text or JSON data associated with a recording.
- **Response:** `{ text: string }` or `{ data: any }` depending on the `format` query parameter.
