
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, Building, TrendingUp, FileText, Settings } from "lucide-react";

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      title: "Active Companies",
      value: "45",
      icon: Building,
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
              <Button className="h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                Add Student
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Building className="w-6 h-6" />
                Add Company
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <FileText className="w-6 h-6" />
                View Reports
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <TrendingUp className="w-6 h-6" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
