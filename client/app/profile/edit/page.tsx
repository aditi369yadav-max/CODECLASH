// client/app/profile/edit/page.tsx

'use client'; // This is a client component

import React from 'react';
import Link from 'next/link';

const EditProfilePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6">Edit Your Profile</h1>
      <p className="text-lg mb-8 text-gray-400">
        This is where you would put your form to edit user details (username, avatar, etc.).
      </p>
      {/* Example form elements - replace with your actual form */}
      <form className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-300 text-sm font-bold mb-2">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
            placeholder="Your new username"
            // You would manage state for this input
          />
        </div>
        <div className="mb-6">
          <label htmlFor="avatar" className="block text-gray-300 text-sm font-bold mb-2">Avatar URL:</label>
          <input
            type="text"
            id="avatar"
            name="avatar"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600"
            placeholder="https://example.com/your-avatar.jpg"
            // You would manage state for this input
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save Changes
          </button>
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-200">
            Cancel
          </Link>
        </div>
      </form>
      <Link href="/dashboard" className="mt-8 text-blue-400 hover:text-blue-600">
        &larr; Back to Dashboard
      </Link>
    </div>
  );
};

export default EditProfilePage;