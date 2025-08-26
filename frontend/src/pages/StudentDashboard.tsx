
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase, getEligibleJobs, applyToJob, getStudentApplications } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Briefcase, BookOpen, TrendingUp, Calendar, CheckCircle, Clock, Send, FileText } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const StudentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [applyingToJob, setApplyingToJob] = useState<string | null>(null);
  const [eligibleJobs, setEligibleJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setStudentProfile(profile);

      // Load eligible jobs
      const jobs = await getEligibleJobs(user.id);
      setEligibleJobs(jobs);

      // Load student's applications
      const applications = await getStudentApplications(user.id);
      setMyApplications(applications);

    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const handleApplyToJob = (job: any) => {
    setSelectedJobForApplication(job);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    setApplyingToJob(selectedJobForApplication.id);
    try {
      const formData = new FormData();
      formData.append('job_id', selectedJobForApplication.id);
      formData.append('student_id', (await supabase.auth.getUser()).data.user!.id);
      if (coverLetter.trim()) {
        formData.append('cover_letter', coverLetter.trim());
      }
      if (selectedFile) {
        formData.append('resume', selectedFile);
      }

      const response = await fetch('http://localhost:8001/api/applications', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit application');
      }

      toast({
        title: "Success",
        description: "Application submitted successfully!",
        className: "bg-success text-success-foreground",
      });

      // Reset form and close modal
      setShowApplicationModal(false);
      setSelectedFile(null);
      setCoverLetter('');
      setSelectedJobForApplication(null);

      // Refresh data to show updated applications
      loadStudentData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to apply to job",
      });
    } finally {
      setApplyingToJob(null);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "Logged out successfully",
        className: "bg-success text-success-foreground",
      });
      navigate("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Eligible Jobs",
      value: eligibleJobs.length.toString(),
      icon: Briefcase,
      color: "text-blue-600"
    },
    {
      title: "Applications Sent",
      value: myApplications.length.toString(),
      icon: Send,
      color: "text-green-600"
    },
    {
      title: "CGPA",
      value: studentProfile?.cgpa ? `${studentProfile.cgpa}/10` : "N/A",
      icon: BookOpen,
      color: "text-purple-600"
    },
    {
      title: "Branch",
      value: studentProfile?.branch || "N/A",
      icon: CheckCircle,
      color: "text-orange-600"
    }
  ];



  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your placement journey and applications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {loading ? "Logging out..." : "Logout"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.title === "Profile Completion" && (
                    <Progress value={85} className="mt-2 h-2" />
                  )}
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligible Job Openings */}
        <Card>
          <CardHeader>
            <CardTitle>Eligible Job Openings</CardTitle>
            <CardDescription>Jobs that match your profile criteria</CardDescription>
          </CardHeader>
          <CardContent>
            {eligibleJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No eligible jobs at the moment</p>
                <p className="text-sm">Jobs matching your criteria will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {eligibleJobs.map((job) => (
                  <div key={job.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{job.company_name}</h3>
                          <Badge variant="secondary">{job.job_type}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{job.role}</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <span>📍 {job.location || 'Not specified'}</span>
                          <span>💰 ₹{job.ctc ? `${job.ctc} LPA` : 'Not specified'}</span>
                          <span>🎓 Min CGPA: {job.min_cgpa}</span>
                          <span>📅 Deadline: {format(new Date(job.deadline), "MMM dd, yyyy")}</span>
                        </div>
                        {job.job_description && (
                          <p className="text-sm mt-2 text-gray-600 line-clamp-2">
                            {job.job_description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-green-600">
                        ✅ Eligible based on your profile
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyToJob(job)}
                        disabled={applyingToJob === job.id}
                      >
                        {applyingToJob === job.id ? "Applying..." : "Apply Now"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Applications */}
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
            <CardDescription>Track your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {myApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No applications yet</p>
                <p className="text-sm">Apply to eligible jobs to see your applications here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((application) => (
                  <div key={application.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{application.jobs?.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{application.jobs?.role}</p>
                      </div>
                      <Badge
                        variant={
                          application.status === "applied" ? "default" :
                          application.status === "shortlisted" ? "secondary" :
                          application.status === "selected" ? "default" : "destructive"
                        }
                      >
                        {application.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Applied: {format(new Date(application.applied_at), "MMM dd, yyyy")}</span>
                      <span>Deadline: {application.jobs?.deadline ? format(new Date(application.jobs.deadline), "MMM dd, yyyy") : 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Resume Builder
            </CardTitle>
            <CardDescription>Create and optimize your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Build Resume</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Interview Prep
            </CardTitle>
            <CardDescription>Practice with mock interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Start Practice</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Career Guidance
            </CardTitle>
            <CardDescription>Get personalized career advice</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Get Advice</Button>
          </CardContent>
        </Card>
      </div>

      {/* Skills & Profile */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Skills & Profile</CardTitle>
          <CardDescription>Your academic profile and skills assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Academic Profile</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>CGPA:</span>
                    <span className="font-medium">{studentProfile?.cgpa || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Branch:</span>
                    <span className="font-medium">{studentProfile?.branch || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Backlogs:</span>
                    <span className="font-medium">{studentProfile?.active_backlog || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Placement Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Eligible Jobs:</span>
                    <span className="font-medium">{eligibleJobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applications:</span>
                    <span className="font-medium">{myApplications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profile Completion:</span>
                    <span className="font-medium">85%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                💡 Tip: Update your resume and cover letter to improve your chances of getting selected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent placement activities</CardDescription>
        </CardHeader>
        <CardContent>
          {myApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start applying to jobs to see your activity here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.slice(0, 3).map((application) => (
                <div key={application.id} className="flex items-center gap-4 p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      Applied to {application.jobs?.company_name} - {application.jobs?.role}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(application.applied_at), "MMM dd")}
                  </span>
                </div>
              ))}
              {eligibleJobs.length > 0 && (
                <div className="flex items-center gap-4 p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">New Eligible Jobs</p>
                    <p className="text-sm text-muted-foreground">
                      {eligibleJobs.length} job{eligibleJobs.length > 1 ? 's' : ''} match your profile
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">Now</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Application Modal */}
      <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for Job</DialogTitle>
            <DialogDescription>
              Submit your application for {selectedJobForApplication?.company_name} - {selectedJobForApplication?.role}
            </DialogDescription>
          </DialogHeader>

          {selectedJobForApplication && (
            <div className="space-y-6">
              {/* Job Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedJobForApplication.company_name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{selectedJobForApplication.role}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>📍 {selectedJobForApplication.location || 'Not specified'}</span>
                  <span>🎓 Min CGPA: {selectedJobForApplication.min_cgpa}</span>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="space-y-2">
                <Label htmlFor="cover_letter">Cover Letter (Optional)</Label>
                <Textarea
                  id="cover_letter"
                  placeholder="Tell us why you're interested in this role and what makes you a good fit..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <Label htmlFor="resume">Resume (Optional)</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (5MB limit)
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          variant: "destructive",
                          title: "File too large",
                          description: "Please select a file smaller than 5MB",
                        });
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApplicationModal(false);
                    setSelectedFile(null);
                    setCoverLetter('');
                    setSelectedJobForApplication(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={applyingToJob === selectedJobForApplication?.id}
                >
                  {applyingToJob === selectedJobForApplication?.id ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
