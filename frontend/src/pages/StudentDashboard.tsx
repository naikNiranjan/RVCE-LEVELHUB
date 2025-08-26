
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

export const StudentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [applyingToJob, setApplyingToJob] = useState<string | null>(null);
  const [eligibleJobs, setEligibleJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
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

  const handleApplyToJob = async (jobId: string) => {
    setApplyingToJob(jobId);
    try {
      await applyToJob(jobId);
      toast({
        title: "Success",
        description: "Application submitted successfully!",
        className: "bg-success text-success-foreground",
      });

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

  const upcomingDrives = [
    {
      company: "Google",
      role: "Software Engineer",
      deadline: "2024-02-15",
      status: "Applied",
      type: "Full-time",
      salary: "₹28 LPA"
    },
    {
      company: "Microsoft",
      role: "Data Analyst",
      deadline: "2024-02-20",
      status: "Interview Scheduled",
      type: "Full-time",
      salary: "₹22 LPA"
    },
    {
      company: "Amazon",
      role: "Cloud Engineer",
      deadline: "2024-02-25",
      status: "Not Applied",
      type: "Full-time",
      salary: "₹25 LPA"
    }
  ];

  const skills = [
    { name: "JavaScript", level: 85 },
    { name: "Python", level: 78 },
    { name: "Data Structures", level: 82 },
    { name: "System Design", level: 65 },
    { name: "Database Management", level: 75 }
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
                        onClick={() => handleApplyToJob(job.id)}
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
    </div>
  );
};

export default StudentDashboard;
