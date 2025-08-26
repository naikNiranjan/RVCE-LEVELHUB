import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Job {
  id: string;
  company_name: string;
  role: string;
  job_type: string;
  location?: string;
  deadline: string;
}

interface UploadResult {
  total_processed: number;
  matched_students: number;
  updated_applications: number;
  created_applications: number;
  job_id: string;
  status_applied: string;
}

interface ShortlistUploadProps {
  onUploadComplete?: () => void;
}

export const ShortlistUpload = ({ onUploadComplete }: ShortlistUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("shortlisted");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const loadActiveJobs = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/jobs');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJobs(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  // Load active jobs on component mount
  useEffect(() => {
    loadActiveJobs();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "File size must be less than 10MB",
        });
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedJobId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select both a file and a job",
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('job_id', selectedJobId);
      formData.append('shortlist_file', selectedFile);
      formData.append('status', selectedStatus);

      const response = await fetch('http://localhost:8001/api/applications/shortlist/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult(result.data);
        toast({
          title: "Upload successful",
          description: result.message,
        });

        // Reset form
        setSelectedFile(null);
        const fileInput = document.getElementById('shortlist-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.message || "An error occurred during upload",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Network error occurred during upload",
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Shortlist Upload
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file containing student shortlist for bulk status updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-2">
          <Label htmlFor="shortlist-file">Shortlist File</Label>
          <Input
            id="shortlist-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {/* Job Selection */}
        <div className="space-y-2">
          <Label htmlFor="job-select">Select Job</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={uploading}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a job for the shortlist" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{job.company_name} - {job.role}</span>
                    <span className="text-sm text-muted-foreground">
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedJob && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedJob.job_type}</Badge>
                <span className="text-sm font-medium">{selectedJob.company_name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{selectedJob.role}</p>
              <p className="text-xs text-muted-foreground">📍 {selectedJob.location || 'Not specified'}</p>
            </div>
          )}
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="status-select">Application Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={uploading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shortlisted">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Shortlisted
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Rejected
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Students in the file will have their application status updated to "{selectedStatus}"
          </p>
        </div>

        {/* File Format Instructions */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>File Format Requirements:</strong>
            <br />
            • CSV or Excel file (.csv, .xlsx, .xls)
            <br />
            • Must contain either "email" or "usn" (roll number) column
            <br />
            • Students will be matched by email or USN
            <br />
            • Maximum file size: 10MB
          </AlertDescription>
        </Alert>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !selectedJobId || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Shortlist
            </>
          )}
        </Button>

        {/* Upload Result */}
        {uploadResult && (
          <Alert className={uploadResult.matched_students > 0 ? "border-green-200" : "border-yellow-200"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Upload Summary:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Processed:</span> {uploadResult.total_processed}
                  </div>
                  <div>
                    <span className="font-medium">Matched Students:</span> {uploadResult.matched_students}
                  </div>
                  <div>
                    <span className="font-medium">Updated Applications:</span> {uploadResult.updated_applications}
                  </div>
                  <div>
                    <span className="font-medium">New Applications:</span> {uploadResult.created_applications}
                  </div>
                </div>
                {uploadResult.matched_students === 0 && (
                  <p className="text-yellow-700 mt-2">
                    No students were matched. Please check that the email addresses or USNs in your file match the student records in the system.
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};