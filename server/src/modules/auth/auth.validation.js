/**
 * @FILE: auth.validation.js
 * @RESPONSIBILITY: Zod validation schemas for student registration and login payloads.
 * @DEPENDENCIES: zod, rbacAuthorization.js.
 * @MODIFICATION_HOTSPOT: UserRegistrationSchema and UserLoginSchema.
 * @AUTHOR: Garima Mittal
 */

import { z } from 'zod';
import { ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

export const UserRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters').max(80),
  studentIdentificationNumber: z.string().min(4, 'Student ID required').max(20),
  emailAddress: z.string().email('Invalid student email address format'),
  passwordCredential: z.string().min(8, 'Password must be at least 8 characters long'),
  phoneNumber: z.string().optional(),
  userRoleTier: z.enum([
    ERP_USER_ROLES.ADMIN,
    ERP_USER_ROLES.OPERATIONS,
    ERP_USER_ROLES.CUSTOMER,
    ERP_USER_ROLES.PUBLIC
  ]).optional()
});

export const UserLoginSchema = z.object({
  emailAddress: z.string().email('Invalid student email address format'),
  passwordCredential: z.string().min(1, 'Password credential is required')
});
