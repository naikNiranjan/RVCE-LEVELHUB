import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getAllApplications } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Users, X, CheckSquare, Square } from "lucide-react";
import { format } from "date-fns";

export const Applications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get filter parameters from navigation state
  const filterJobId = location.state?.filterJobId;
  const filterCompany = location.state?.filterCompany;

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      // Try backend API first - get all applications
      const backendResponse = await fetch('http://localhost:8001/api/applications/all');
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        if (backendData.success) {
          setApplications(backendData.data);
          return;
        }
      }

      // Fallback to Supabase if backend is not available
      console.warn('Backend not available, using Supabase fallback');
      const data = await getAllApplications();
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load applications",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    // Filter by status
    const statusMatch = statusFilter === "all" || app.status === statusFilter;

    // Filter by job if specified
    const jobMatch = !filterJobId || app.job_id === filterJobId;

    return statusMatch && jobMatch;
  });

  // Calculate status counts considering job filter
  const baseApplications = filterJobId
    ? applications.filter(app => app.job_id === filterJobId)
    : applications;

  const statusCounts = {
    all: baseApplications.length,
    applied: baseApplications.filter(app => app.status === 'applied').length,
    shortlisted: baseApplications.filter(app => app.status === 'shortlisted').length,
    selected: baseApplications.filter(app => app.status === 'selected').length,
    rejected: baseApplications.filter(app => app.status === 'rejected').length,
  };

  const clearJobFilter = () => {
    navigate("/applications", { replace: true });
  };

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(applicationId);
      } else {
        newSet.delete(applicationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    } else {
      setSelectedApplications(new Set());
    }
  };

  const bulkUpdateApplications = async () => {
    if (selectedApplications.size === 0 || !bulkUpdateStatus) {
      toast({
        variant: "destructive",
        title: "Selection Required",
        description: "Please select applications and choose a status",
      });
      return;
    }

    try {
      // Optimistically update UI
      setApplications(prevApps =>
        prevApps.map(app =>
          selectedApplications.has(app.id)
            ? { ...app, status: bulkUpdateStatus }
            : app
        )
      );

      // Update each selected application
      const updatePromises = Array.from(selectedApplications).map(applicationId =>
        fetch(`http://localhost:8001/api/applications/${applicationId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ status: bulkUpdateStatus }),
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const failed = results.filter(result => result.status === 'rejected').length;

      if (failed > 0) {
        // Revert optimistic updates on partial failure
        loadApplications();
        toast({
          variant: "destructive",
          title: "Partial Update",
          description: `${failed} out of ${selectedApplications.size} updates failed`,
        });
      } else {
        toast({
          title: "Bulk Update Successful",
          description: `${selectedApplications.size} applications updated to ${bulkUpdateStatus}`,
          className: "bg-success text-success-foreground",
        });
      }

      // Clear selections
      setSelectedApplications(new Set());
      setBulkUpdateStatus("");

      // Refresh data
      loadApplications();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        variant: "destructive",
        title: "Bulk Update Failed",
        description: "Failed to update applications",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      // Optimistically update UI first for better UX
      setApplications(prevApps =>
        prevApps.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );

      // Call backend API to update status
      const response = await fetch(`http://localhost:8001/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setApplications(prevApps =>
          prevApps.map(app =>
            app.id === applicationId
              ? { ...app, status: prevApps.find(a => a.id === applicationId)?.status }
              : app
          )
        );

        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update status');
      }

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus}`,
        className: "bg-success text-success-foreground",
      });

      // Refresh data to ensure consistency
      loadApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update application status",
      });
    }
  };

  const handleExport = async () => {
    try {
      let exportUrl = `http://localhost:8001/api/applications/export?status_filter=${statusFilter}`;

      // Add job filter if specified
      if (filterJobId) {
        exportUrl += `&job_id=${filterJobId}`;
      }

      const response = await fetch(exportUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Create filename with job info if filtered
      const jobSuffix = filterCompany ? `_${filterCompany.replace(/\s+/g, '_')}` : '';
      a.download = `applications_${statusFilter}${jobSuffix}_${new Date().toISOString().split('T')[0]}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Applications data exported to CSV",
        className: "bg-success text-success-foreground",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export applications data",
      });
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin-dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground">Applications Management</h1>
                {filterCompany && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filterCompany}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearJobFilter}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {filterCompany
                  ? `Viewing applications for ${filterCompany}`
                  : "View and manage all student applications"
                }
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{statusCounts.all}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applied</p>
                  <p className="text-2xl font-bold">{statusCounts.applied}</p>
                </div>
                <Badge variant="secondary">Applied</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shortlisted</p>
                  <p className="text-2xl font-bold">{statusCounts.shortlisted}</p>
                </div>
                <Badge variant="secondary">Shortlisted</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Selected</p>
                  <p className="text-2xl font-bold">{statusCounts.selected}</p>
                </div>
                <Badge variant="default">Selected</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{statusCounts.rejected}</p>
                </div>
                <Badge variant="destructive">Rejected</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Applications */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {filterCompany ? `${filterCompany} Applications` : "All Applications"}
                </CardTitle>
                <CardDescription>
                  {filterCompany
                    ? `Manage student applications for ${filterCompany}`
                    : "Manage student applications across all jobs"
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                    <SelectItem value="applied">Applied ({statusCounts.applied})</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted ({statusCounts.shortlisted})</SelectItem>
                    <SelectItem value="selected">Selected ({statusCounts.selected})</SelectItem>
                    <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedApplications.size > 0 && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {selectedApplications.size} application{selectedApplications.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={bulkUpdateStatus} onValueChange={setBulkUpdateStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Choose status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={bulkUpdateApplications}
                    disabled={!bulkUpdateStatus}
                  >
                    Update Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedApplications(new Set());
                      setBulkUpdateStatus("");
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No applications found</p>
                <p className="text-sm">Applications will appear here once students start applying</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All Header */}
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <Checkbox
                    checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>

                {filteredApplications.map((application) => (
                  <div key={application.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedApplications.has(application.id)}
                          onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{application.profiles?.full_name}</h3>
                            <Badge variant="outline">{application.profiles?.usn}</Badge>
                            <Badge variant="outline">{application.profiles?.branch}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-1">
                            Applied to: <span className="font-medium">{application.jobs?.company_name} - {application.jobs?.role}</span>
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                            <span>📧 {application.profiles?.email}</span>
                            <span>🎓 CGPA: {application.profiles?.cgpa}</span>
                            <span>📅 Applied: {format(new Date(application.applied_at), "MMM dd, yyyy")}</span>
                          </div>
                          {application.cover_letter && (
                            <p className="text-sm text-gray-600 mt-2">
                              <strong>Cover Letter:</strong> {application.cover_letter}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Select
                          value={application.status}
                          onValueChange={(value) => updateApplicationStatus(application.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="selected">Selected</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        {/* Action buttons removed as requested */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Applications;