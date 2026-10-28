#!/usr/bin/env python3
"""Test security utilities to verify all security improvements are working correctly."""
import sys
import os

# Add bin directory to path
sys.path.insert(0, os.path.dirname(__file__))

from security_utils import (
    safe_join,
    is_within_directory,
    validate_file_size,
    MAX_FILE_SIZE,
    MAX_CONTENT_SIZE
)


def test_safe_join():
    """Test safe_join function."""
    print("Testing safe_join...")

    # Valid join
    try:
        result = safe_join("/tmp", "test.txt")
        assert result == "/tmp/test.txt"
        print("✓ Valid join works correctly")
    except ValueError as e:
        print(f"✗ Valid join failed: {e}")
        return False

    # Path traversal prevention
    try:
        result = safe_join("/tmp", "../../../etc/passwd")
        print(f"✗ Path traversal not prevented: {result}")
        return False
    except ValueError as e:
        print(f"✓ Path traversal prevented: {e}")

    # Outside directory check
    try:
        result = safe_join("/tmp", "../etc/passwd")
        print(f"✗ Outside directory check failed: {result}")
        return False
    except ValueError as e:
        print(f"✓ Outside directory check works: {e}")

    return True


def test_is_within_directory():
    """Test is_within_directory function."""
    print("\nTesting is_within_directory...")

    tmp_dir = "/tmp"
    test_file = "/tmp/test.txt"

    assert is_within_directory(test_file, tmp_dir) == True
    print("✓ Within directory check works")

    test_file = "/etc/passwd"
    assert is_within_directory(test_file, tmp_dir) == False
    print("✓ Outside directory check works")

    return True


def test_validate_file_size():
    """Test validate_file_size function."""
    print("\nTesting validate_file_size...")

    # Create a test file
    test_file = "/tmp/test_security_1MB.bin"
    with open(test_file, 'wb') as f:
        f.write(b'\x00' * (MAX_FILE_SIZE + 1000))

    try:
        validate_file_size(test_file)
        print(f"✗ File size validation failed (should have raised ValueError)")
        os.remove(test_file)
        return False
    except ValueError as e:
        print(f"✓ File size validation works: {e}")
        os.remove(test_file)

    # Create a valid size file
    test_file = "/tmp/test_security_1KB.bin"
    with open(test_file, 'wb') as f:
        f.write(b'\x00' * 1024)

    size = validate_file_size(test_file)
    assert size == 1024
    print(f"✓ File size validation works correctly: {size} bytes")
    os.remove(test_file)

    return True


def test_max_constants():
    """Test that size constants are properly defined."""
    print("\nTesting size constants...")

    assert MAX_FILE_SIZE == 10 * 1024 * 1024  # 10MB
    assert MAX_CONTENT_SIZE == 1 * 1024 * 1024  # 1MB

    print(f"✓ MAX_FILE_SIZE: {MAX_FILE_SIZE} bytes ({MAX_FILE_SIZE / 1024 / 1024:.2f} MB)")
    print(f"✓ MAX_CONTENT_SIZE: {MAX_CONTENT_SIZE} bytes ({MAX_CONTENT_SIZE / 1024 / 1024:.2f} MB)")

    return True


def main():
    """Run all security utility tests."""
    print("=" * 60)
    print("Running Security Utility Tests")
    print("=" * 60)

    tests = [
        ("safe_join", test_safe_join),
        ("is_within_directory", test_is_within_directory),
        ("validate_file_size", test_validate_file_size),
        ("constants", test_max_constants),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"\n✗ {name} test failed with exception: {e}")
            import traceback
            traceback.print_exc()
            failed += 1

    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)