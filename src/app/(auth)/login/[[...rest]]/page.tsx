import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { AuthFormSkeleton } from "../../auth-form-skeleton";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignIn fallback={<AuthFormSkeleton />} />
    </Suspense>
  );
}
