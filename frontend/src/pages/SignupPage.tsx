
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
      // Prepare student data for signup
      const studentData = {
        fullName: data.fullName,
        usn: data.usn,
        branch: data.branch,
        cgpa: data.cgpa,
        tenth: data.tenth,
        twelfth: data.twelfth,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : null,
        graduationYear: data.graduationYear,
        activeBacklog: data.activeBacklog,
        aadharCard: data.aadharCard
      };

      const authData = await signUpUser(data.email, data.password, studentData);

      if (authData.user) {
        toast({
          title: "Success",
          description: "Account created successfully! All your information has been saved. Please check your email to verify your account.",
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