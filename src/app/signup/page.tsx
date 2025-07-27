"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
       <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;The ultimate rap battle generator. My friends and I are hooked!&rdquo;
            </p>
            <footer className="text-sm">Another happy user</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="w-full h-auto flex items-center justify-center py-2">
            <img src="/img/logo.png" alt="suckerpunch" className="w-[240px]" />
            </div>
            <p className="text-sm text-muted-foreground">
              Create an account to get started
            </p>
          </div>
          <AuthForm mode="signup" />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Log in
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
