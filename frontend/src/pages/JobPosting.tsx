import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const JobPosting = () => {
  const [loading, setLoading] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [driveDate, setDriveDate] = useState<Date>();
  const [assessmentDate, setAssessmentDate] = useState<Date>();
  const [deadline, setDeadline] = useState<Date>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: "",
    job_type: "",
    role: "",
    location: "",
    stipend: "",
    ctc: "",
    joining_bonus: "",
    retention_bonus: "",
    min_cgpa: "6.0",
    max_active_backlogs: "0",
    gender_preference: "No preference",
    job_description: "",
    process_details: ""
  });

  const branches = [
    "CSE", "ISE", "AIML", "CSE DS", "CSE CY", "ECE", "EEE", "ME", "CE", "CHE", "AE", "IE", "EIE", "ETE"
  ];

  const jobTypes = [
    "Dream", "Internship + FTE", "FTE", "Internship", "Super Dream"
  ];

  const genderOptions = [
    { value: "No preference", label: "No preference" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Both", label: "Both" }
  ];

  const handleBranchChange = (branch: string, checked: boolean) => {
    if (checked) {
      setSelectedBranches([...selectedBranches, branch]);
    } else {
      setSelectedBranches(selectedBranches.filter(b => b !== branch));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name || !formData.job_type || !formData.role || !deadline) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (selectedBranches.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one eligible branch",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const jobData = {
        ...formData,
        eligible_branches: selectedBranches,
        min_cgpa: parseFloat(formData.min_cgpa),
        max_active_backlogs: parseInt(formData.max_active_backlogs),
        stipend: formData.stipend ? parseFloat(formData.stipend) : null,
        ctc: formData.ctc ? parseFloat(formData.ctc) : null,
        joining_bonus: formData.joining_bonus ? parseFloat(formData.joining_bonus) : null,
        retention_bonus: formData.retention_bonus ? parseFloat(formData.retention_bonus) : null,
        drive_date: driveDate ? driveDate.toISOString() : null,
        assessment_date: assessmentDate ? assessmentDate.toISOString() : null,
        deadline: deadline.toISOString(),
        created_by: user.id,
        gender_preference: formData.gender_preference || null
      };

      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job posting created successfully!",
        className: "bg-success text-success-foreground",
      });

      // Navigate back to dashboard after a short delay to show success message
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create job posting",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin-dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Post New Job</h1>
            <p className="text-muted-foreground">Create a new placement drive</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Company and job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="e.g., ABB, Google, Microsoft"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type *</Label>
                  <Select value={formData.job_type} onValueChange={(value) => handleInputChange("job_type", value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    placeholder="e.g., Software Engineer, Data Analyst"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., Bengaluru, Mumbai"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
              <CardDescription>Compensation information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stipend">Stipend (₹/month)</Label>
                  <Input
                    id="stipend"
                    type="number"
                    value={formData.stipend}
                    onChange={(e) => handleInputChange("stipend", e.target.value)}
                    placeholder="30000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctc">CTC (₹/year)</Label>
                  <Input
                    id="ctc"
                    type="number"
                    value={formData.ctc}
                    onChange={(e) => handleInputChange("ctc", e.target.value)}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joining_bonus">Joining Bonus (₹)</Label>
                  <Input
                    id="joining_bonus"
                    type="number"
                    value={formData.joining_bonus}
                    onChange={(e) => handleInputChange("joining_bonus", e.target.value)}
                    placeholder="100000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention_bonus">Retention Bonus (₹)</Label>
                  <Input
                    id="retention_bonus"
                    type="number"
                    value={formData.retention_bonus}
                    onChange={(e) => handleInputChange("retention_bonus", e.target.value)}
                    placeholder="100000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Criteria</CardTitle>
              <CardDescription>Set requirements for applicants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_cgpa">Minimum CGPA</Label>
                  <Input
                    id="min_cgpa"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.min_cgpa}
                    onChange={(e) => handleInputChange("min_cgpa", e.target.value)}
                    placeholder="6.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_active_backlogs">Max Active Backlogs</Label>
                  <Input
                    id="max_active_backlogs"
                    type="number"
                    min="0"
                    value={formData.max_active_backlogs}
                    onChange={(e) => handleInputChange("max_active_backlogs", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender_preference">Gender Preference</Label>
                  <Select value={formData.gender_preference} onValueChange={(value) => handleInputChange("gender_preference", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Eligible Branches *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {branches.map((branch) => (
                    <div key={branch} className="flex items-center space-x-2">
                      <Checkbox
                        id={branch}
                        checked={selectedBranches.includes(branch)}
                        onCheckedChange={(checked) => handleBranchChange(branch, checked as boolean)}
                      />
                      <Label htmlFor={branch} className="text-sm">{branch}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Description */}
          <Card>
            <CardHeader>
              <CardTitle>Important Dates & Description</CardTitle>
              <CardDescription>Schedule and job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Drive Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !driveDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {driveDate ? format(driveDate, "PPP") : <span>Pick drive date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={driveDate}
                        onSelect={setDriveDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Assessment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !assessmentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {assessmentDate ? format(assessmentDate, "PPP") : <span>Pick assessment date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={assessmentDate}
                        onSelect={setAssessmentDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Application Deadline *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : <span>Pick deadline</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_description">Job Description</Label>
                <Textarea
                  id="job_description"
                  value={formData.job_description}
                  onChange={(e) => handleInputChange("job_description", e.target.value)}
                  placeholder="Detailed job description, requirements, etc."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="process_details">Process Details</Label>
                <Textarea
                  id="process_details"
                  value={formData.process_details}
                  onChange={(e) => handleInputChange("process_details", e.target.value)}
                  placeholder="Interview process, assessment details, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin-dashboard")}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Creating..." : "Create Job Posting"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobPosting;