
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, Building, TrendingUp, FileText, Settings, Briefcase, Eye, Edit } from "lucide-react";
import { format } from "date-fns";

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
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
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      title: "Total Students",
      value: "1,247",
      icon: Users,
      change: "+12%",
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
      title: "Placements This Year",
      value: "892",
      icon: TrendingUp,
      change: "+15%",
      changeType: "positive"
    },
    {
      title: "Pending Applications",
      value: "23",
      icon: FileText,
      change: "-5%",
      changeType: "negative"
    }
  ];

  const recentCompanies = [
    { name: "Google", positions: 12, deadline: "2024-02-15", status: "Active" },
    { name: "Microsoft", positions: 8, deadline: "2024-02-20", status: "Active" },
    { name: "Amazon", positions: 15, deadline: "2024-02-25", status: "Active" },
    { name: "Adobe", positions: 6, deadline: "2024-03-01", status: "Upcoming" }
  ];

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last month
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Company Drives</CardTitle>
            <CardDescription>Latest placement opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCompanies.map((company, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {company.positions} positions • Deadline: {company.deadline}
                    </p>
                  </div>
                  <Badge variant={company.status === 'Active' ? 'default' : 'secondary'}>
                    {company.status}
                  </Badge>
                </div>
              ))}
            </div>
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
              <Button variant="outline" className="h-20 flex flex-col gap-2">
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
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activities and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">New student registered</p>
                <p className="text-sm text-muted-foreground">John Doe (CSE) joined the platform</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">2 mins ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Company drive updated</p>
                <p className="text-sm text-muted-foreground">Google updated their requirements</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">15 mins ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div>
                <p className="font-medium">Placement completed</p>
                <p className="text-sm text-muted-foreground">5 students placed at Microsoft</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
