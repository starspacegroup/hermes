import { describe, it, expect } from 'vitest';
import { isEmail, isPasswordStrong, isEmpty } from './validation';

describe('Validation utilities', () => {
  describe('isEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(isEmail('user123@test-domain.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isEmail('invalid-email')).toBe(false);
      expect(isEmail('user@')).toBe(false);
      expect(isEmail('@domain.com')).toBe(false);
      expect(isEmail('user@@domain.com')).toBe(false);
      expect(isEmail('')).toBe(false);
    });
  });

  describe('isPasswordStrong', () => {
    it('should accept strong passwords', () => {
      expect(isPasswordStrong('StrongPass123')).toBe(true);
      expect(isPasswordStrong('MySecure1')).toBe(true);
      expect(isPasswordStrong('P@ssw0rd!')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isPasswordStrong('weak')).toBe(false);
      expect(isPasswordStrong('lowercase123')).toBe(false);
      expect(isPasswordStrong('UPPERCASE123')).toBe(false);
      expect(isPasswordStrong('NoNumbers!')).toBe(false);
      expect(isPasswordStrong('')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty values', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' text ')).toBe(false);
      expect(isEmpty('0')).toBe(false);
    });
  });
});
