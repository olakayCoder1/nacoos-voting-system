// app/admin/register/page.tsx
"use client"

import { useFormState } from "react-dom"
import { registerAdmin } from "@/app/actions/auth"

export default function AdminRegisterPage() {
  const [state, formAction] = useFormState(registerAdmin, null)

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Register Admin</h2>
      <form action={formAction} className="space-y-4">
        <input
          name="username"
          placeholder="Username"
          className="w-full px-4 py-2 border rounded"
          required
        />
        <input
          name="name"
          placeholder="Full Name"
          className="w-full px-4 py-2 border rounded"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email (optional)"
          className="w-full px-4 py-2 border rounded"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded"
          required
        />
        <input
          name="role"
          placeholder="Role (e.g. superadmin)"
          className="w-full px-4 py-2 border rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
          Register
        </button>
      </form>
      {state?.error && <p className="mt-4 text-red-600">{state.error}</p>}
      {state?.success && <p className="mt-4 text-green-600">Admin registered successfully</p>}
    </div>
  )
}
