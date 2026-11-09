import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth, type UserRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Create account — KrossBuild" },
      {
        name: "description",
        content: "Create a KrossBuild account to raise or fund verified bills.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("donor");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await signUp(email.trim(), password, role, displayName.trim());
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("Account created. Check your email to confirm your address.");
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium">
            I am joining as
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="donor">Donor</option>
            <option value="creator">Creator</option>
          </select>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="text-sm text-green-700">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          Create account
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already registered?{" "}
        <Link to="/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
