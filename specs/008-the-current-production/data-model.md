# Data Model: APK Download Validation

**Feature**: Fix Production APK Download Failure  
**Phase**: 1 (Design & Contracts)  
**Date**: 2025-09-27

## Core Entities

### GitHub Release

**Purpose**: Container for APK files created by the build workflow

**Attributes**:

- **id**: Unique identifier for the release
- **tag_name**: Git tag associated with the release
- **name**: Display name of the release
- **published**: Boolean indicating if release is published (not draft)
- **assets**: Collection of attached files including APK
- **created_at**: Timestamp when release was created
- **published_at**: Timestamp when release was published

**Validation Rules**:

- Must be published (not draft) for asset access
- Must contain at least one asset with `.apk` extension
- Tag name should follow semantic versioning pattern
- Created and published timestamps must be valid dates

**State Transitions**:

- Draft → Published (enables asset download)
- Published → Cannot revert to draft

### APK Asset

**Purpose**: Android application package file attached to GitHub release

**Attributes**:

- **name**: Filename of the APK asset
- **size**: File size in bytes
- **content_type**: MIME type (should be application/vnd.android.package-archive)
- **download_url**: GitHub API URL for downloading the asset
- **browser_download_url**: Direct download URL for browsers/CLI
- **created_at**: Timestamp when asset was uploaded
- **updated_at**: Timestamp of last modification

**Validation Rules**:

- Filename must end with `.apk` extension
- Size must be greater than 1MB (minimum for real app)
- Content type should match APK format
- File must have valid ZIP/APK signature (504b0304)
- Download URLs must be accessible with proper permissions

**File Format Validation**:

- ZIP signature check: First 4 bytes must be 504b0304 (hex)
- Minimum size validation: At least 1,048,576 bytes (1MB)
- Non-empty file requirement

### Download Operation

**Purpose**: Process of retrieving APK asset from GitHub release

**Attributes**:

- **release_tag**: Target release tag ('latest' or specific version)
- **pattern**: File pattern for matching assets ('\*.apk')
- **destination**: Local directory for downloaded files
- **attempt_count**: Number of download attempts made
- **success**: Boolean indicating successful completion
- **error_code**: Exit code from failed attempts
- **file_path**: Local path to downloaded APK file

**Validation Rules**:

- Release tag must exist in repository
- Pattern must match at least one asset
- Destination directory must be writable
- Maximum 3 retry attempts for transient failures
- Error code 2 should not trigger retries (systematic failure)

**State Transitions**:

- Pending → In Progress → Success/Failed
- Failed (transient) → Retry → In Progress
- Failed (systematic) → Terminal failure

### Validation Result

**Purpose**: Outcome of APK download and integrity verification

**Attributes**:

- **download_successful**: Boolean indicating download completion
- **file_exists**: Boolean indicating file presence on disk
- **file_size**: Actual size of downloaded file
- **format_valid**: Boolean indicating valid APK/ZIP format
- **integrity_check**: Result of file corruption check
- **error_details**: Descriptive error messages for failures

**Validation Rules**:

- All boolean fields must be explicitly set
- File size must match expected size from asset metadata
- Format validation must check ZIP signature
- Error details must provide actionable troubleshooting information

## Entity Relationships

```
GitHub Release (1) --> (many) APK Asset
Download Operation (1) --> (1) GitHub Release
Download Operation (1) --> (1) APK Asset
Download Operation (1) --> (1) Validation Result
```

## Data Flow

1. **Release Discovery**: Query GitHub API for latest release
2. **Asset Enumeration**: List all assets in the target release
3. **APK Identification**: Filter assets matching `*.apk` pattern
4. **Download Execution**: Retrieve APK asset using GitHub CLI
5. **Integrity Validation**: Verify file format and completeness
6. **Result Documentation**: Record success/failure with details

## Error Scenarios

### No Releases Found

- **Entity State**: GitHub Release does not exist
- **Validation**: Repository has no published releases
- **Error Code**: 1 (no releases exist)

### Release Exists but No APK

- **Entity State**: GitHub Release exists, APK Asset collection is empty
- **Validation**: No assets match `*.apk` pattern
- **Error Code**: 3 (no APK assets found)

### Permission Denied

- **Entity State**: GitHub Release exists, APK Asset exists, Download Operation fails
- **Validation**: GITHUB_TOKEN lacks read permissions
- **Error Code**: 2 (permission denied via GitHub CLI)

### File Corruption

- **Entity State**: Download Operation succeeds, Validation Result indicates corruption
- **Validation**: File size zero or invalid ZIP signature
- **Error Code**: 4 (empty file) or 5 (invalid format)

## Integration Points

### GitHub CLI Commands

- `gh release list --limit 1`: Verify releases exist
- `gh release view latest`: List available assets
- `gh release download latest --pattern "*.apk"`: Download APK files

### File System Operations

- Directory creation: `mkdir -p ./artifacts`
- File existence: `test -f "$APK_FILE"`
- Size check: `stat -c%s "$APK_FILE"`
- Format validation: `head -c 4 "$APK_FILE" | od -An -tx1`

### GitHub Actions Integration

- Step outputs: `echo "key=value" >> $GITHUB_OUTPUT`
- Error reporting: `echo "::error title=Title::Message"`
- Environment variables: `GITHUB_TOKEN`, `SKIP_DATA_CLEANUP`
