/**
 * @FILE: auth.model.js
 * @RESPONSIBILITY: Mongoose User schema with bcrypt password hashing, 4-tier RBAC role definitions, and audit fields.
 * @DEPENDENCIES: mongoose, bcryptjs.
 * @MODIFICATION_HOTSPOT: userSchema definition and pre-save password hash hook.
 * @AUTHOR: Garima Mittal
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ERP_USER_ROLES } from '../../middleware/rbacAuthorization.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    studentIdentificationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    emailAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordCredentialHash: {
      type: String,
      required: true
    },
    userRoleTier: {
      type: String,
      required: true,
      enum: Object.values(ERP_USER_ROLES),
      default: ERP_USER_ROLES.CUSTOMER
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    isAccountActive: {
      type: Boolean,
      default: true
    },
    lastLoginTimestamp: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

userSchema.pre('save', async function (nextCallback) {
  if (!this.isModified('passwordCredentialHash')) {
    return nextCallback();
  }
  const saltRounds = 10;
  this.passwordCredentialHash = await bcrypt.hash(this.passwordCredentialHash, saltRounds);
  console.log(`[User Model]: Securely hashed password credential for ${this.emailAddress}`);
  return nextCallback();
});

userSchema.methods.verifyPasswordMatch = async function (candidatePasswordString) {
  return bcrypt.compare(candidatePasswordString, this.passwordCredentialHash);
};

export const UserModel = mongoose.model('User', userSchema);

