import { AuthCard } from "@/components/auth/AuthCard";

export const LoginPage = () => {
  const handleLogin = async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Login attempt:", data);
    // Add your login logic here
  };

  return (
    <AuthCard 
      type="login" 
      onSubmit={handleLogin}
    />
  );
};

export default LoginPage;