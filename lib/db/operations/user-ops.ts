// User Operations

import prisma from '../prisma';
import bcrypt from 'bcrypt';
import { User } from '@/types';

export const createUser = async (
  email: string,
  password: string,
  accountType: User['accountType']
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      accountType: accountType as any,
    },
  });

  return {
    id: user.id,
    email: user.email,
    password: user.password,
    accountType: user.accountType as User['accountType'],
    createdAt: user.createdAt,
    subscription: user.subscription as User['subscription'],
  };
};

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return undefined;

  return {
    id: user.id,
    email: user.email,
    password: user.password,
    accountType: user.accountType as User['accountType'],
    createdAt: user.createdAt,
    subscription: user.subscription as User['subscription'],
  };
};

export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      accountType: user.accountType as User['accountType'],
      createdAt: user.createdAt,
      subscription: user.subscription as User['subscription'],
    };
  } catch {
    return null;
  }
};

export const verifyPassword = async (password: string, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};
