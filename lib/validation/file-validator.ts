/**
 * File validation utilities for security hardening.
 * Implements path traversal prevention, filename sanitization, and magic bytes validation.
 */

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  sanitizedName?: string;
  errors: string[];
}

/**
 * Dangerous filename patterns that should be rejected
 */
const DANGEROUS_PATTERNS = [
  /\.\.\//,           // Path traversal (forward slash)
  /\.\.\\/,           // Path traversal (backslash)
  /^\.+$/,            // Hidden files (only dots)
  /[\x00-\x1f]/,      // Control characters
  /[<>:"|?*]/,        // Windows reserved characters
  /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i,  // Windows reserved names
];

/**
 * Characters to remove during sanitization
 */
const SANITIZE_PATTERN = /[<>"'&\x00-\x1f\\/:*?|]/g;

/**
 * Magic bytes signatures for common file types
 */
export const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF)
  "image/bmp": [[0x42, 0x4D]], // BM
  "image/tiff": [
    [0x49, 0x49, 0x2A, 0x00], // Little endian
    [0x4D, 0x4D, 0x00, 0x2A], // Big endian
  ],
  "image/avif": [[0x00, 0x00, 0x00]], // AVIF starts with ftyp box (variable offset)
  "image/heic": [[0x00, 0x00, 0x00]], // HEIC starts with ftyp box
  "image/heif": [[0x00, 0x00, 0x00]], // HEIF starts with ftyp box
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "video/mp4": [[0x00, 0x00, 0x00]], // MP4 starts with ftyp box
  "video/webm": [[0x1A, 0x45, 0xDF, 0xA3]], // EBML header
  "video/quicktime": [[0x00, 0x00, 0x00]], // MOV starts with ftyp box
};

/**
 * Content-Type to file extension mapping
 */
const CONTENT_TYPE_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/gif": ["gif"],
  "image/webp": ["webp"],
  "image/bmp": ["bmp"],
  "image/tiff": ["tif", "tiff"],
  "image/avif": ["avif"],
  "image/heic": ["heic"],
  "image/heif": ["heif"],
  "image/svg+xml": ["svg"],
  "application/pdf": ["pdf"],
  "video/mp4": ["mp4", "m4v"],
  "video/webm": ["webm"],
  "video/quicktime": ["mov"],
  "video/x-msvideo": ["avi"],
  "audio/mpeg": ["mp3"],
  "audio/wav": ["wav"],
  "audio/ogg": ["ogg"],
  "text/plain": ["txt"],
  "text/html": ["html", "htm"],
  "text/css": ["css"],
  "text/javascript": ["js"],
  "application/json": ["json"],
  "application/xml": ["xml"],
  "application/zip": ["zip"],
  "application/x-rar-compressed": ["rar"],
  "application/x-7z-compressed": ["7z"],
  "application/gzip": ["gz"],
};

/**
 * Checks if filename contains path traversal patterns.
 * 
 * @param fileName - The filename to check
 * @returns true if path traversal is detected
 */
export function containsPathTraversal(fileName: string): boolean {
  return fileName.includes("../") || fileName.includes("..\\");
}

/**
 * Validates a filename for security issues.
 * 
 * @param fileName - The filename to validate
 * @returns FileValidationResult with validation status and errors
 */
export function validateFileName(fileName: string): FileValidationResult {
  const errors: string[] = [];

  if (!fileName || fileName.trim().length === 0) {
    return {
      valid: false,
      errors: ["File name is empty."],
    };
  }

  // Check for path traversal (Requirement 4.2)
  if (containsPathTraversal(fileName)) {
    return {
      valid: false,
      errors: ["Invalid file name."], // Don't reveal specific reason
    };
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(fileName)) {
      errors.push("Invalid file name.");
      break;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Sanitize and return
  const sanitizedName = sanitizeFileName(fileName);
  
  return {
    valid: true,
    sanitizedName,
    errors: [],
  };
}

/**
 * Sanitizes a filename by removing dangerous characters.
 * This function is idempotent: sanitize(sanitize(x)) === sanitize(x)
 * 
 * @param fileName - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "";

  // Remove dangerous characters
  let sanitized = fileName.replace(SANITIZE_PATTERN, "");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

  // Replace multiple consecutive dots with single dot
  sanitized = sanitized.replace(/\.{2,}/g, ".");

  // Replace multiple consecutive spaces with single space
  sanitized = sanitized.replace(/\s{2,}/g, " ");

  // If filename becomes empty after sanitization, use a default
  if (sanitized.length === 0) {
    return "unnamed_file";
  }

  // Limit filename length (255 is common filesystem limit)
  if (sanitized.length > 255) {
    const ext = getExtension(sanitized);
    const baseName = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = ext ? `${baseName}.${ext}` : baseName;
  }

  return sanitized;
}

/**
 * Gets the file extension from a filename.
 */
function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Validates that Content-Type matches the file extension.
 * 
 * @param contentType - The declared Content-Type
 * @param fileName - The filename with extension
 * @returns true if Content-Type matches extension
 */
export function validateContentTypeExtension(
  contentType: string,
  fileName: string
): boolean {
  if (!contentType || !fileName) {
    return false;
  }

  const extension = getExtension(fileName).toLowerCase();
  if (!extension) {
    // No extension - can't validate, allow it
    return true;
  }

  const normalizedContentType = contentType.toLowerCase().split(";")[0].trim();
  const allowedExtensions = CONTENT_TYPE_EXTENSIONS[normalizedContentType];

  if (!allowedExtensions) {
    // Unknown content type - allow it (don't block unknown types)
    return true;
  }

  return allowedExtensions.includes(extension);
}


/**
 * Validates file magic bytes match the declared Content-Type.
 * Only validates for known image types where magic bytes are reliable.
 * 
 * @param buffer - The file buffer (at least first 12 bytes)
 * @param declaredContentType - The declared Content-Type
 * @returns true if magic bytes match or validation is not applicable
 */
export function validateMagicBytes(
  buffer: Buffer,
  declaredContentType: string
): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const normalizedContentType = declaredContentType.toLowerCase().split(";")[0].trim();
  const signatures = MAGIC_BYTES[normalizedContentType];

  if (!signatures) {
    // No known signature for this type - allow it
    return true;
  }

  // Special handling for container formats (MP4, MOV, AVIF, HEIC)
  // These use ISO Base Media File Format with 'ftyp' box
  if (
    normalizedContentType === "video/mp4" ||
    normalizedContentType === "video/quicktime" ||
    normalizedContentType === "image/avif" ||
    normalizedContentType === "image/heic" ||
    normalizedContentType === "image/heif"
  ) {
    return validateFtypBox(buffer, normalizedContentType);
  }

  // Check if any signature matches
  for (const signature of signatures) {
    if (matchesSignature(buffer, signature)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if buffer starts with the given signature.
 */
function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validates ISO Base Media File Format (ftyp box) for MP4, MOV, AVIF, HEIC.
 */
function validateFtypBox(buffer: Buffer, contentType: string): boolean {
  if (buffer.length < 12) {
    return false;
  }

  // ftyp box structure: [4 bytes size][4 bytes 'ftyp'][4 bytes brand]
  // The 'ftyp' marker is at offset 4
  const ftypMarker = buffer.slice(4, 8).toString("ascii");
  if (ftypMarker !== "ftyp") {
    return false;
  }

  // Check brand (major_brand) at offset 8
  const brand = buffer.slice(8, 12).toString("ascii");

  // Valid brands for each content type
  const validBrands: Record<string, string[]> = {
    "video/mp4": ["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "M4A "],
    "video/quicktime": ["qt  ", "mqt "],
    "image/avif": ["avif", "avis", "mif1"],
    "image/heic": ["heic", "heix", "mif1"],
    "image/heif": ["heif", "mif1"],
  };

  const allowedBrands = validBrands[contentType];
  if (!allowedBrands) {
    return true; // Unknown type, allow
  }

  return allowedBrands.includes(brand);
}

/**
 * Comprehensive file validation combining all checks.
 * 
 * @param fileName - The filename to validate
 * @param contentType - The declared Content-Type
 * @param buffer - Optional file buffer for magic bytes validation
 * @returns FileValidationResult with all validation results
 */
export function validateFile(
  fileName: string,
  contentType: string,
  buffer?: Buffer
): FileValidationResult {
  const errors: string[] = [];

  // Validate filename
  const fileNameResult = validateFileName(fileName);
  if (!fileNameResult.valid) {
    return fileNameResult;
  }

  const sanitizedName = fileNameResult.sanitizedName;

  // Validate Content-Type matches extension
  if (!validateContentTypeExtension(contentType, fileName)) {
    errors.push("File type does not match the extension.");
  }

  // Validate magic bytes if buffer provided
  if (buffer && !validateMagicBytes(buffer, contentType)) {
    errors.push("File content does not match the declared content type.");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      sanitizedName,
      errors,
    };
  }

  return {
    valid: true,
    sanitizedName,
    errors: [],
  };
}
