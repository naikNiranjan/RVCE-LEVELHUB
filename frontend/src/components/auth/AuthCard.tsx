import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  type: "login" | "signup";
  onSubmit: (data: any) => void;
}

export const AuthCard = ({ type, onSubmit }: AuthCardProps) => {
  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup fields
  const [usn, setUsn] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [tenth, setTenth] = useState("");
  const [twelfth, setTwelfth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [graduationYear, setGraduationYear] = useState("");
  const [activeBacklog, setActiveBacklog] = useState(false);
  const [aadharCard, setAadharCard] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const branches = [
    "CSE", "ISE", "AIML", "CSE DS", "CSE CY", "ECE", "EEE", "ME", "CE", "CHE", "AE", "IE"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === "login") {
      if (!email || !password) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all fields",
        });
        return;
      }
    } else {
      // Validate signup fields
      if (!email || !password || !usn || !branch || !cgpa || !tenth || !twelfth || !dateOfBirth || !graduationYear || !aadharCard) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all fields",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const formData = type === "login" 
        ? { email, password }
        : { 
            email, password, usn, branch, cgpa: parseFloat(cgpa), 
            tenth: parseFloat(tenth), twelfth: parseFloat(twelfth),
            dateOfBirth, graduationYear: parseInt(graduationYear),
            activeBacklog, aadharCard 
          };
      
      await onSubmit(formData);
      toast({
        title: "Success",
        description: type === "login" ? "Welcome back!" : "Account created successfully!",
        className: "bg-success text-success-foreground",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    navigate(type === "login" ? "/signup" : "/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-foreground">RVCE LevelHub</h2>
          </div>
          <CardTitle className="text-2xl font-semibold">
            {type === "login" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {type === "login" 
              ? "Enter your credentials to access your account" 
              : "Enter your information to get started"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {type === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="usn">USN</Label>
                  <Input
                    id="usn"
                    placeholder="Enter your USN"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={branch} onValueChange={setBranch} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branchOption) => (
                        <SelectItem key={branchOption} value={branchOption}>
                          {branchOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cgpa">CGPA</Label>
                    <Input
                      id="cgpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      placeholder="0.00"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      min="2020"
                      max="2030"
                      placeholder="2024"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenth">10th %</Label>
                    <Input
                      id="tenth"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="85.5"
                      value={tenth}
                      onChange={(e) => setTenth(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twelfth">12th %</Label>
                    <Input
                      id="twelfth"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="90.5"
                      value={twelfth}
                      onChange={(e) => setTwelfth(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateOfBirth}
                        onSelect={setDateOfBirth}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aadharCard">Aadhar Card Number</Label>
                  <Input
                    id="aadharCard"
                    placeholder="Enter Aadhar card number"
                    value={aadharCard}
                    onChange={(e) => setAadharCard(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="activeBacklog"
                    checked={activeBacklog}
                    onCheckedChange={setActiveBacklog}
                  />
                  <Label htmlFor="activeBacklog">Active Backlog</Label>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {type === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    toast({
                      title: "Password Reset",
                      description: "Password reset functionality coming soon!",
                    });
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : (type === "login" ? "Sign in" : "Create account")}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {type === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-primary hover:underline font-medium"
            >
              {type === "login" ? "Create account" : "Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};