import Link from "next/link";
import CredentialsSignInForm from "./credentials-signin-form";

export default function Page() {

  return (
    <div className="relative z-10 w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            <span className="text-teal-500">Clean</span>Nami
          </h1>
          <p className="mt-2 text-gray-600">Welome back!</p>
        </div>

        <CredentialsSignInForm />

        <p className="mt-8 text-center text-sm text-gray-500">
          Don&apos;t have an account?
          <Link
          href='/sign-up'
            className="font-semibold leading-6 text-teal-600 hover:text-teal-500"
          >
            Sign up
          </Link>
        </p>
      </div>
  );
};