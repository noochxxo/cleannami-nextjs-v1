"use client";
import React, { useState } from "react";
import { SignupForm } from "./SignupForm";

export const SignupModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
      >
        Start Your Subscription
      </button>

      <SignupForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
