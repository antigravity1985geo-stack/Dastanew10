"use client";

import { useState } from "react";
import { Warehouse, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function LoginPage() {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Register-only fields
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || "შესვლა ვერ მოხერხდა");
      }
    } catch (err) {
      setError("ტექნიკური შეცდომა");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს");
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(email, password, displayName, companyName, companySlug);
      if (!result.success) {
        setError(result.error || "რეგისტრაცია ვერ მოხერხდა");
      }
    } catch (err) {
      setError("ტექნიკური შეცდომა");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Warehouse className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase">
              DASTA CLOUD
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRegisterMode
                ? "შექმენით ახალი ანგარიში თქვენი ბიზნესისთვის"
                : "სისტემაში შესასვლელად შეიყვანეთ მონაცემები"}
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {isRegisterMode ? "რეგისტრაცია" : "ავტორიზაცია"}
            </CardTitle>
            <CardDescription>
              {isRegisterMode
                ? "შეავსეთ ფორმა ახალი ანგარიშის შესაქმნელად"
                : "შეიყვანეთ ელ-ფოსტა და პაროლი"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={isRegisterMode ? handleRegister : handleLogin}
              className="flex flex-col gap-4"
            >
              {isRegisterMode && (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="displayName">თქვენი სახელი</Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="მაგ: გიორგი"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="companyName">კომპანიის სახელი</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="მაგ: DASTA ვარკეთილი"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="companySlug">კომპანიის URL</Label>
                    <Input
                      id="companySlug"
                      type="text"
                      placeholder="მაგ: dasta-varketili (არასავალდებულო)"
                      value={companySlug}
                      onChange={(e) =>
                        setCompanySlug(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      ლათინური ასოები და ტირე (არასავალდებულო)
                    </p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">ელ-ფოსტა</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">პაროლი</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isRegisterMode ? (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {isLoading ? "რეგისტრაცია..." : "რეგისტრაცია"}
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {isLoading ? "შესვლა..." : "შესვლა"}
                  </>
                )}
              </Button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError("");
                  }}
                >
                  {isRegisterMode
                    ? "უკვე გაქვთ ანგარიში? შესვლა"
                    : "არ გაქვთ ანგარიში? რეგისტრაცია"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
