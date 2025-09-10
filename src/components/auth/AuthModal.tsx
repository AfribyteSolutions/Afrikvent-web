"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { AuthError, Provider } from "@supabase/supabase-js";
import { Eye, EyeOff, X, Mail, Lock, User, Phone } from "lucide-react";

interface AuthModalProps {
  type: "signin" | "signup";
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userEmail: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  type,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (type === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone },
          },
        });

        if (authError) throw authError;

        if (data.user) {
          await supabase.from("users").insert({
            user_id: data.user.id,
            name,
            email,
            phone,
            role: "attendee",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        onSuccess(data.user?.email || "");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess(data.user?.email || "");
      }
      onClose();
    } catch (err) {
      const e = err as AuthError;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: Provider) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const e = err as AuthError;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {type === "signin" ? "Log in" : "Sign up"}
                </h2>
                <p className="text-blue-100 mt-2 text-sm">
                  {type === "signin"
                    ? "Welcome back! Let's get you to your next event."
                    : "Tell us a little about you"}
                </p>
              </div>
            </div>

            {/* Social Auth (Moved to the top) */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleSocialAuth("google")}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-base text-gray-500 hover:bg-gray-50 font-semibold transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M24 9.5c3.34 0 5.86 1.13 7.82 2.92l6.53-6.53C35.86 2.37 30.14 0 24 0 14.86 0 6.91 5.09 3.01 12.33l7.07 5.46C12.89 12.39 18.06 9.5 24 9.5z" />
                    <path fill="#34A853" d="M44 24.5c0-1.57-.14-3.07-.4-4.52H24v8.58h11.23c-1.22 4.41-5.11 7.4-9.82 7.4-5.94 0-10.9-4.04-12.72-9.6H1.2c4.08 7.91 12.01 13.52 22.8 13.52 7.15 0 13.41-2.39 17.8-6.54l-6.53-5.06z" />
                    <path fill="#FBBC04" d="M11.28 29.43c-1.88-.51-3.6-1.29-5.04-2.29l-7.07 5.46c2.81 4.54 6.89 7.7 11.58 9.38 2.24.8 4.67 1.22 7.21 1.22 2.54 0 4.97-.42 7.21-1.22l-7.07-5.46z" />
                    <path fill="#EA4335" d="M24 9.5c3.34 0 5.86 1.13 7.82 2.92l6.53-6.53C35.86 2.37 30.14 0 24 0 14.86 0 6.91 5.09 3.01 12.33l7.07 5.46C12.89 12.39 18.06 9.5 24 9.5z" />
                  </svg>
                  Sign in with Google
                </button>
              </div>
              <div className="relative flex justify-center py-4">
                  <span className="px-2 bg-white text-gray-500 text-sm">or</span>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {type === "signup" && (
                  <>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {type === "signup" && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all"
                >
                  {loading ? (type === "signin" ? "Signing In..." : "Creating Account...") : type === "signin" ? "Log in" : "Sign up"}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;