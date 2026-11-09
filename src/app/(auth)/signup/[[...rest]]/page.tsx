import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { AuthFormSkeleton } from "../../auth-form-skeleton";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignUp fallback={<AuthFormSkeleton />} />
    </Suspense>
  );
}
