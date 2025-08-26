
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Briefcase, BookOpen, TrendingUp, Calendar, CheckCircle, Clock } from "lucide-react";

export const StudentDashboard = () => {
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
      title: "Profile Completion",
      value: "85%",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Applications Sent",
      value: "12",
      icon: Briefcase,
      color: "text-blue-600"
    },
    {
      title: "Interviews Scheduled",
      value: "3",
      icon: Calendar,
      color: "text-orange-600"
    },
    {
      title: "Skill Assessment",
      value: "78%",
      icon: BookOpen,
      color: "text-purple-600"
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
        {/* Upcoming Drives */}
        <Card>
          <CardHeader>
            <CardTitle>Company Drives</CardTitle>
            <CardDescription>Current placement opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDrives.map((drive, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{drive.company}</h3>
                      <p className="text-sm text-muted-foreground">{drive.role}</p>
                    </div>
                    <Badge
                      variant={
                        drive.status === "Applied" ? "default" :
                        drive.status === "Interview Scheduled" ? "secondary" : "outline"
                      }
                    >
                      {drive.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{drive.type}</span>
                    <span>{drive.salary}</span>
                    <span>Deadline: {drive.deadline}</span>
                  </div>
                  {drive.status === "Not Applied" && (
                    <Button size="sm" className="w-full mt-3">
                      Apply Now
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Assessment</CardTitle>
            <CardDescription>Your current skill levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-sm text-muted-foreground">{skill.level}%</span>
                  </div>
                  <Progress value={skill.level} className="h-2" />
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <BookOpen className="w-4 h-4 mr-2" />
              Take Skill Test
            </Button>
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
          <CardTitle>My Activity</CardTitle>
          <CardDescription>Your recent placement activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Application Submitted</p>
                <p className="text-sm text-muted-foreground">Successfully applied to Google Software Engineer position</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Interview Scheduled</p>
                <p className="text-sm text-muted-foreground">Microsoft Data Analyst interview on Feb 25, 2024</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">2 days ago</span>
            </div>
            <div className="flex items-center gap-4 p-3 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/20">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium">Skill Test Completed</p>
                <p className="text-sm text-muted-foreground">Scored 78% in Python programming assessment</p>
              </div>
              <span className="text-xs text-muted-foreground ml-auto">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
