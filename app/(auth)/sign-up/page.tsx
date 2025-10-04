import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import CredentialsSignUpForm from "./credentials-signup-form";

export default function Page() {

  return (
    <div className="relative z-10 w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            <span className="text-teal-500">Clean</span>Nami
          </h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <CredentialsSignUpForm />

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?
          <Link
            href='/sign-in'
            className="font-semibold leading-6 text-teal-600 hover:text-teal-500"
          >
            Log in
          </Link>
        </p>
      </div>
  );
};