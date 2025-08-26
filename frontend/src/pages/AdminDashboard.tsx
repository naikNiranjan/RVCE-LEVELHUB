
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, Building, TrendingUp, FileText, Settings, Briefcase, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShortlistUpload } from "@/components/ShortlistUpload";

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [jobsWithApplicants, setJobsWithApplicants] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data when component becomes visible (useful after navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load job count
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      setJobCount(count || 0);

      // Load recent jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentJobs(jobs || []);

      // Load jobs with applicant counts
      const jobsWithCounts = await loadJobsWithApplicantCounts();
      setJobsWithApplicants(jobsWithCounts);

      // Load dynamic stats
      await loadStatsData();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadStatsData = async () => {
    try {
      // Get total students count
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setTotalStudents(studentsCount || 0);

      // Get total applications count
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      setTotalApplications(applicationsCount || 0);

      // Get selected applications count
      const { count: selectedCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'selected');

      setSelectedApplications(selectedCount || 0);

      // Calculate dynamic stats
      const dynamicStats = [
        {
          title: "Total Students",
          value: totalStudents.toString(),
          icon: Users,
          change: "+12%", // This could be calculated based on time period
          changeType: "positive"
        },
        {
          title: "Active Job Postings",
          value: jobCount.toString(),
          icon: Briefcase,
          change: "+8%",
          changeType: "positive"
        },
        {
          title: "Total Applications",
          value: totalApplications.toString(),
          icon: FileText,
          change: "+15%",
          changeType: "positive"
        },
        {
          title: "Successful Placements",
          value: selectedApplications.toString(),
          icon: TrendingUp,
          change: "+25%",
          changeType: "positive"
        }
      ];

      setStats(dynamicStats);
    } catch (error) {
      console.error('Error loading stats data:', error);
    }
  };

  const loadJobsWithApplicantCounts = async () => {
    try {
      // Get all jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!jobs) return [];

      // Get applicant counts for each job
      const jobsWithCounts = await Promise.all(
        jobs.map(async (job) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            applicantCount: count || 0
          };
        })
      );

      return jobsWithCounts;
    } catch (error) {
      console.error('Error loading jobs with applicant counts:', error);
      return [];
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

  const handleViewJob = (job: any) => {
    setSelectedJob(job);
    setModalMode('view');
    setShowJobModal(true);
  };

  const handleEditJob = (job: any) => {
    setSelectedJob(job);
    setModalMode('edit');
    setShowJobModal(true);
  };

  const handleViewApplicants = (job: any) => {
    navigate("/applications", { state: { filterJobId: job.id, filterCompany: job.company_name } });
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job posting deleted successfully",
        className: "bg-success text-success-foreground",
      });

      // Refresh the jobs list
      loadDashboardData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete job posting",
      });
    }
  };

  const handleSaveJob = async (updatedJob: any) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update(updatedJob)
        .eq('id', selectedJob.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job posting updated successfully",
        className: "bg-success text-success-foreground",
      });

      setShowJobModal(false);
      setSelectedJob(null);
      loadDashboardData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update job posting",
      });
    }
  };

  // Calculate dynamic stats from database
  const [stats, setStats] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [selectedApplications, setSelectedApplications] = useState(0);


  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Placement Cell Dashboard</h1>
          <p className="text-muted-foreground">Manage placements and student applications</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
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
      </div>


      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Postings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Job Postings</CardTitle>
            <CardDescription>Latest placement opportunities created</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No job postings yet</p>
                <p className="text-sm">Create your first job posting to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.slice(0, 4).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{job.company_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {job.role} • Deadline: {format(new Date(job.deadline), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job-wise Applicants */}
        <Card>
          <CardHeader>
            <CardTitle>Job-wise Applicants</CardTitle>
            <CardDescription>View applicants for each job posting</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsWithApplicants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active job postings</p>
                <p className="text-sm">Create job postings to see applicants here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobsWithApplicants.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewApplicants(job)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{job.company_name}</h3>
                          <Badge variant="secondary">{job.job_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {job.applicantCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          applicant{job.applicantCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>📍 {job.location || 'Not specified'}</span>
                      <span>🎓 Min CGPA: {job.min_cgpa}</span>
                      <span>📅 Deadline: {format(new Date(job.deadline), "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate("/job-posting")}
              >
                <Briefcase className="w-6 h-6" />
                Post New Job
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                Manage Students
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate("/applications")}
              >
                <FileText className="w-6 h-6" />
                View Applications
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <TrendingUp className="w-6 h-6" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shortlist Upload */}
        <div className="lg:col-span-2">
          <ShortlistUpload onUploadComplete={loadDashboardData} />
        </div>
      </div>

      {/* Recent Jobs */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Job Postings</CardTitle>
              <CardDescription>Latest placement opportunities created</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/job-posting")}>
              <Briefcase className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No job postings yet</p>
              <p className="text-sm">Create your first job posting to get started</p>
              <Button className="mt-4" onClick={() => navigate("/job-posting")}>
                Create Job Posting
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{job.company_name}</h3>
                      <Badge variant="secondary">{job.job_type}</Badge>
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{job.role}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>📍 {job.location || 'Not specified'}</span>
                      <span>🎓 Min CGPA: {job.min_cgpa}</span>
                      <span>📅 Deadline: {format(new Date(job.deadline), "MMM dd, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewJob(job)}
                      title="View job details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditJob(job)}
                      title="Edit job posting"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      title="Delete job posting"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Job View/Edit Modal */}
      <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'view' ? 'View Job Posting' : 'Edit Job Posting'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'view'
                ? 'Review job posting details'
                : 'Make changes to the job posting'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <JobModalContent
              job={selectedJob}
              mode={modalMode}
              onSave={handleSaveJob}
              onCancel={() => setShowJobModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Job Modal Content Component
const JobModalContent = ({ job, mode, onSave, onCancel }: any) => {
  const [formData, setFormData] = useState({
    company_name: job.company_name || '',
    job_type: job.job_type || '',
    role: job.role || '',
    location: job.location || '',
    stipend: job.stipend || '',
    ctc: job.ctc || '',
    joining_bonus: job.joining_bonus || '',
    retention_bonus: job.retention_bonus || '',
    min_cgpa: job.min_cgpa || 6.0,
    max_active_backlogs: job.max_active_backlogs || 0,
    gender_preference: job.gender_preference || 'No preference',
    job_description: job.job_description || '',
    process_details: job.process_details || '',
    status: job.status || 'active'
  });

  const [selectedBranches, setSelectedBranches] = useState<string[]>(job.eligible_branches || []);

  const branches = [
    "CSE", "ISE", "AIML", "CSE DS", "CSE CY", "ECE", "EEE", "ME", "CE", "CHE", "AE", "IE", "EIE", "ETE"
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBranchChange = (branch: string, checked: boolean) => {
    if (checked) {
      setSelectedBranches([...selectedBranches, branch]);
    } else {
      setSelectedBranches(selectedBranches.filter(b => b !== branch));
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (selectedBranches.length === 0) {
      alert('Please select at least one eligible branch');
      return;
    }

    const updatedData = {
      ...formData,
      eligible_branches: selectedBranches,
      min_cgpa: parseFloat(formData.min_cgpa.toString()),
      max_active_backlogs: parseInt(formData.max_active_backlogs.toString()),
      stipend: formData.stipend ? parseFloat(formData.stipend.toString()) : null,
      ctc: formData.ctc ? parseFloat(formData.ctc.toString()) : null,
      joining_bonus: formData.joining_bonus ? parseFloat(formData.joining_bonus.toString()) : null,
      retention_bonus: formData.retention_bonus ? parseFloat(formData.retention_bonus.toString()) : null,
    };

    onSave(updatedData);
  };

  if (mode === 'view') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Company Name</Label>
            <p className="mt-1 text-sm text-gray-900">{job.company_name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Job Type</Label>
            <p className="mt-1 text-sm text-gray-900">{job.job_type}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Role</Label>
            <p className="mt-1 text-sm text-gray-900">{job.role}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Location</Label>
            <p className="mt-1 text-sm text-gray-900">{job.location || 'Not specified'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Minimum CGPA</Label>
            <p className="mt-1 text-sm text-gray-900">{job.min_cgpa}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Max Active Backlogs</Label>
            <p className="mt-1 text-sm text-gray-900">{job.max_active_backlogs}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Eligible Branches</Label>
            <p className="mt-1 text-sm text-gray-900">{job.eligible_branches?.join(', ') || 'None'}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Status</Label>
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="mt-1">
              {job.status}
            </Badge>
          </div>
        </div>

        {job.job_description && (
          <div>
            <Label className="text-sm font-medium">Job Description</Label>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{job.job_description}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => handleInputChange("company_name", e.target.value)}
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
              <SelectItem value="Dream">Dream</SelectItem>
              <SelectItem value="Internship + FTE">Internship + FTE</SelectItem>
              <SelectItem value="FTE">FTE</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Super Dream">Super Dream</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            value={formData.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_cgpa">Minimum CGPA</Label>
          <Input
            id="min_cgpa"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.min_cgpa}
            onChange={(e) => handleInputChange("min_cgpa", parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_active_backlogs">Max Active Backlogs</Label>
          <Input
            id="max_active_backlogs"
            type="number"
            min="0"
            value={formData.max_active_backlogs}
            onChange={(e) => handleInputChange("max_active_backlogs", parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
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

      <div className="space-y-2">
        <Label htmlFor="job_description">Job Description</Label>
        <Textarea
          id="job_description"
          value={formData.job_description}
          onChange={(e) => handleInputChange("job_description", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="process_details">Process Details</Label>
        <Textarea
          id="process_details"
          value={formData.process_details}
          onChange={(e) => handleInputChange("process_details", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default AdminDashboard;
