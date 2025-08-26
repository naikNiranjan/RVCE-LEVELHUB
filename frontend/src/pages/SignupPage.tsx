import { AuthCard } from "@/components/auth/AuthCard";

export const SignupPage = () => {
  const handleSignup = async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Signup attempt:", data);
    // Add your signup logic here
  };

  return (
    <AuthCard 
      type="signup" 
      onSubmit={handleSignup}
    />
  );
};

export default SignupPage;