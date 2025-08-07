"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { signInFormSchema, signUpFormSchema } from "../validators";
import { signIn, signOut } from "@/auth";
import { hashSync } from "bcrypt-ts-edge";
import { prisma } from "@/db/prisma";
import { formatErrors } from "../utils";

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const { email, password } = signInFormSchema.parse(
      Object.fromEntries(formData)
    );

    // Sign in the user
    await signIn("credentials", {
      email,
      password,
    });

    return { success: true, message: "Signed in successfully" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: "Invalid credentials" };
  }
}

// Sign out the user
export async function signOutUser() {
  await signOut();
}

// Sign up the user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const { name, email, password } = signUpFormSchema.parse(
      Object.fromEntries(formData)
    );

    // Hash password
    const hashedPassword = hashSync(password);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await signIn("credentials", {
      email,
      password,
    });

    return { success: true, message: "User created successfully" };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatErrors(error) };
  }
}
