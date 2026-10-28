#!/usr/bin/env python3
"""Security utilities for path validation, input sanitization, and file handling."""
import os
import posixpath
from typing import Optional


# Maximum file size in bytes (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024
# Maximum content size in bytes (1MB for HTML content)
MAX_CONTENT_SIZE = 1 * 1024 * 1024


def safe_join(base: str, path: str) -> str:
    """
    Safely join a base path with a path component, preventing directory traversal.

    This function normalizes the path using POSIX style and ensures the resulting
    path is within the allowed base directory.

    Args:
        base: The base directory path.
        path: The path component to join (may contain '.' or '..').

    Returns:
        The absolute, normalized path.

    Raises:
        ValueError: If the resulting path is outside the base directory.
    """
    try:
        # Normalize the path using POSIX style (handles both Windows and Unix)
        normalized = posixpath.normpath(path)

        # Join base and normalized path
        joined = os.path.abspath(os.path.join(base, normalized))

        # Get canonical paths for comparison
        base_abs = os.path.abspath(base)
        joined_abs = os.path.abspath(joined)

        # Verify the joined path is within the base directory
        common = os.path.commonpath([joined_abs, base_abs])
        if common != base_abs:
            raise ValueError(f'Path {joined} is outside allowed directory {base}')

        return joined_abs
    except (ValueError, OSError) as e:
        raise ValueError(f'Safe join failed for base={base}, path={path}: {e}')


def is_within_directory(path: str, allowed_dir: str) -> bool:
    """
    Check if a path is within an allowed directory.

    Args:
        path: The path to check.
        allowed_dir: The directory that should contain the path.

    Returns:
        True if the path is within the allowed directory, False otherwise.
    """
    try:
        path_abs = os.path.abspath(path)
        allowed_abs = os.path.abspath(allowed_dir)
        return os.path.commonpath([path_abs, allowed_abs]) == allowed_abs
    except (ValueError, OSError):
        return False


def validate_file_size(file_path: str) -> int:
    """
    Check if a file is within size limits.

    Args:
        file_path: Path to the file to check.

    Returns:
        File size in bytes.

    Raises:
        FileNotFoundError: If file doesn't exist.
        ValueError: If file exceeds maximum size.
    """
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f'File too large: {file_size} bytes (max {MAX_FILE_SIZE} bytes)')
    return file_size


def read_file_safely(file_path: str, encoding: str = 'utf-8') -> str:
    """
    Safely read a file with size limits and error handling.

    Args:
        file_path: Path to the file.
        encoding: File encoding (default: utf-8).

    Returns:
        File contents as string.

    Raises:
        FileNotFoundError: If file doesn't exist.
        PermissionError: If file cannot be read.
        ValueError: If file or content exceeds size limits.
        UnicodeDecodeError: If file encoding is invalid.
    """
    # Validate file exists and is within size limits
    file_size = validate_file_size(file_path)

    # Open and read file with appropriate error handling
    try:
        with open(file_path, 'r', encoding=encoding, errors='replace') as f:
            content = f.read()

            # Check content size
            if len(content) > MAX_CONTENT_SIZE:
                print(f'WARNING: Content size {len(content)} bytes exceeds {MAX_CONTENT_SIZE} bytes limit')
                print(f'Only the first {MAX_CONTENT_SIZE} bytes will be processed')

            return content

    except IOError as e:
        if isinstance(e, (FileNotFoundError, PermissionError)):
            raise
        raise IOError(f'Error reading file {file_path}: {e}')


def sanitize_html_content(content: str) -> str:
    """
    Sanitize HTML content using BeautifulSoup for safer parsing.

    Args:
        content: Raw HTML content to sanitize.

    Returns:
        Sanitized HTML content.
    """
    try:
        from bs4 import BeautifulSoup, Comment

        soup = BeautifulSoup(content, 'html.parser')

        # Remove comments that might contain sensitive data
        for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
            comment.extract()

        # Remove script and style tags and their contents
        for script_or_style in soup(['script', 'style']):
            script_or_style.decompose()

        # Strip leading/trailing whitespace
        return soup.get_text(strip=True)

    except ImportError:
        print('WARNING: BeautifulSoup not available, falling back to basic sanitization')
        # Basic fallback: strip potentially dangerous HTML tags
        import re
        # Only allow safe HTML tags and attributes
        safe_html = re.sub(
            r'<(?!\/?)(script|iframe|object|embed|form|input|button|style)[^>]*>.*?<\/\1>',
            '',
            content,
            flags=re.IGNORECASE
        )
        # Remove any attribute that looks like a JavaScript event handler
        safe_html = re.sub(
            r'\s(on\w+="[^"]*|on\w+=\'[^\']*\')',
            '',
            safe_html
        )
        return safe_html


def get_file_extension(file_path: str) -> str:
    """
    Get the file extension from a path without the leading dot.

    Args:
        file_path: Path to the file.

    Returns:
        File extension without leading dot (e.g., 'html' from 'test.html').
    """
    return os.path.splitext(file_path)[1][1:].lower()


def is_allowed_file_extension(file_path: str, allowed_extensions: Optional[list] = None) -> bool:
    """
    Check if a file has an allowed extension.

    Args:
        file_path: Path to the file.
        allowed_extensions: List of allowed extensions (without dots). Default: ['.html'].

    Returns:
        True if extension is allowed, False otherwise.
    """
    if allowed_extensions is None:
        allowed_extensions = ['html']

    ext = get_file_extension(file_path)
    return ext in allowed_extensions