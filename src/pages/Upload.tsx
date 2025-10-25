import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon } from "lucide-react";
import AppLayout from "@/components/AppLayout";

import { SUBJECTS, SEMESTERS } from "@/config/constants";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  // Preview thumbnail when selected
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!videoFile) {
      toast({ variant: "destructive", title: "Please select a video file" });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Starting upload process...');

      if (!user) {
        toast({ variant: "destructive", title: "Please login first" });
        return;
      }

      console.log('User authenticated:', user.id);

      // Upload video to storage with retry mechanism
      const videoExt = videoFile.name.split(".").pop();
      const videoFileName = `${user.id}/videos/${Date.now()}_video.${videoExt}`;
      
      const { error: videoUploadError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (videoUploadError) {
        throw new Error(`Failed to upload video: ${videoUploadError.message}`);
      }

      // Get video public URL first to ensure it worked
      const { data: videoUrlData } = supabase.storage
        .from("videos")
        .getPublicUrl(videoFileName);

      if (!videoUrlData) {
        throw new Error("Failed to get video URL after upload");
      }

      // Handle thumbnail upload in the videos bucket
      let thumbnailUrl = null;
      if (thumbnailFile) {
        try {
          // First, check if file size is within limits (max 5MB for thumbnails)
          if (thumbnailFile.size > 5 * 1024 * 1024) {
            throw new Error("Thumbnail file size must be less than 5MB");
          }

          // Verify file type
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(thumbnailFile.type)) {
            throw new Error("Thumbnail must be JPEG, PNG, or WEBP format");
          }

          const thumbExt = thumbnailFile.name.split(".").pop();
          // Store thumbnails in a thumbnails subfolder within the user's folder
          const thumbFileName = `${user.id}/thumbnails/${Date.now()}_thumb.${thumbExt}`;

          // Upload the thumbnail to the videos bucket
          console.log('Uploading thumbnail...', {
            fileName: thumbFileName,
            fileType: thumbnailFile.type,
            fileSize: thumbnailFile.size
          });

          const { error: thumbUploadError, data: thumbUploadData } = await supabase.storage
            .from("videos")
            .upload(thumbFileName, thumbnailFile, {
              cacheControl: '3600',
              upsert: true,
              contentType: thumbnailFile.type
            });

          if (thumbUploadError) {
            console.error('Thumbnail upload error:', thumbUploadError);
            throw thumbUploadError;
          }

          console.log('Thumbnail upload successful:', thumbUploadData);

          // Get the public URL
          const { data: thumbUrlData } = supabase.storage
            .from("videos")
            .getPublicUrl(thumbFileName);

          if (!thumbUrlData) {
            throw new Error("Failed to get thumbnail URL");
          }

          thumbnailUrl = thumbUrlData.publicUrl;
          console.log('Final thumbnail URL:', thumbnailUrl);
          console.log('Thumbnail URL generated:', thumbnailUrl);

          toast({
            title: "Thumbnail uploaded successfully",
            description: "Your video thumbnail has been added"
          });

        } catch (error: any) {
          console.error("Thumbnail upload failed:", error);
          toast({
            variant: "destructive",
            title: "Thumbnail upload failed",
            description: error.message || "Failed to upload thumbnail. Your video will be uploaded without a thumbnail"
          });
        }
      }

      const videoPublicUrl = videoUrlData.publicUrl;

      // Insert video metadata
      const videoData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        subject: formData.get("subject") as string,
        topic: formData.get("topic") as string,
        semester: formData.get("semester") as string,
        video_url: videoPublicUrl,
        thumbnail_url: thumbnailUrl,
        uploader_id: user.id,
      };

      console.log('Inserting video data:', videoData);

      const { error: insertError } = await supabase.from("videos").insert(videoData);

      if (insertError) throw insertError;

      toast({ title: "Video uploaded successfully!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-6 w-6" />
              Upload Video
            </CardTitle>
            <CardDescription>
              Share your educational content with the KLH community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="video">Video File</Label>
                  <Input
                    id="video"
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Supported formats: MP4, WEBM</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail Image</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                  />
                  <p className="text-sm text-muted-foreground">Supported formats: JPG, PNG, WEBP</p>
                  {thumbnailPreview && (
                    <div className="mt-2 relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Introduction to Data Structures"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what this video covers..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Department</Label>
                  <Select name="subject" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select name="semester" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTERS.map((sem) => (
                        <SelectItem key={sem} value={sem}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  name="topic"
                  placeholder="e.g., Arrays, Linked Lists"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Uploading..." : "Upload Video"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Upload;
