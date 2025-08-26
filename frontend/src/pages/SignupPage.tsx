import { AuthCard } from "@/components/auth/AuthCard";
import { signUpUser } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (data: any) => {
    setLoading(true);
    try {
      const authData = await signUpUser(data.email, data.password, data);

      if (authData.user) {
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account.",
          className: "bg-success text-success-foreground",
        });
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      type="signup"
      onSubmit={handleSignup}
    />
  );
};

export default SignupPage;