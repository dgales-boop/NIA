import { useState } from "react";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { login } from "../../services/api";
import { Mail, Lock, LogIn } from "lucide-react";

export default function LoginScreen({ onLoggedIn }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const context = await login({ email, password });
            onLoggedIn(context.user);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
            <div className="mb-6 space-y-1.5 text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h2>
                <p className="text-sm text-gray-500">
                    Sign in to your NIA account to continue
                </p>
            </div>

            <div className="space-y-4">
                <InputField
                    label="Email address"
                    value={email}
                    onChange={setEmail}
                    icon={Mail}
                />
                <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    icon={Lock}
                />

                <Button type="submit" loading={loading} className="w-full" icon={LogIn}>
                    {loading ? "Signing in..." : "Sign in"}
                </Button>

                {error && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>
        </form>
    );
}
